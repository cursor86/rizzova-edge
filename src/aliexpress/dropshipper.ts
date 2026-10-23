import type { Env } from "../env";
import { callBusiness } from "./client";

/**
 * AE-Dropshipper domain calls. Field names follow the DS API responses; AliExpress wraps
 * arrays as { <name>_d_t_o: [...] } and sometimes returns a single object instead of an array,
 * so every list goes through `list()`. Verify against your app's API Test Tool before launch.
 */
export const list = <T>(v: T | T[] | undefined | null): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

export interface DsSkuProperty {
  sku_property_name?: string;
  sku_property_value?: string;
  property_value_definition_name?: string; // seller's display name ("Red")
  sku_image?: string;
}
export interface DsSku {
  sku_id?: string | number;
  id?: string;                 // sku_attr string, e.g. "14:193#Red;5:100014064"
  sku_attr?: string;
  sku_price?: string;          // list price
  offer_sale_price?: string;   // price you pay
  sku_available_stock?: number | string;
  ae_sku_property_dtos?: { ae_sku_property_d_t_o?: DsSkuProperty | DsSkuProperty[] };
}
export interface DsProduct {
  ae_item_base_info_dto?: {
    product_id?: string | number;
    subject?: string;
    detail?: string;
    category_id?: number | string;
    currency_code?: string;
    product_status_type?: string; // "onSelling" when live
  };
  ae_item_sku_info_dtos?: { ae_item_sku_info_d_t_o?: DsSku | DsSku[] };
  ae_multimedia_info_dto?: { image_urls?: string }; // ";"-separated
}

export async function getDsProduct(env: Env, token: string, aeProductId: string): Promise<DsProduct> {
  const payload = await callBusiness(env, "aliexpress.ds.product.get", token, {
    product_id: aeProductId,
    ship_to_country: env.AE_SHIP_TO_COUNTRY,
    target_currency: env.STORE_CURRENCY,
    target_language: env.STORE_LANGUAGE.toUpperCase(),
  });
  if (payload.rsp_code !== undefined && String(payload.rsp_code) !== "200") {
    throw new Error(`ds.product.get ${aeProductId}: ${payload.rsp_msg ?? payload.rsp_code}`);
  }
  return payload.result as DsProduct;
}

export async function getDsCategories(env: Env, token: string, parentId?: number) {
  const payload = await callBusiness(env, "aliexpress.ds.category.get", token, {
    category_id: parentId,
    language: env.STORE_LANGUAGE,
  });
  return list(payload?.resp_result?.result?.categories?.category);
}

export interface PlaceOrderInput {
  outOrderId: string;
  address: {
    fullName: string; phone: string; phoneCountry: string;
    line1: string; line2?: string; city: string; province: string; zip: string; country: string;
  };
  items: { aeProductId: string; skuAttr: string; quantity: number }[];
}

/** Places the supplier order. Returns AliExpress order ids. */
export async function placeDsOrder(env: Env, token: string, input: PlaceOrderInput): Promise<string[]> {
  const a = input.address;
  const request = {
    out_order_id: input.outOrderId,
    logistics_address: {
      full_name: a.fullName, contact_person: a.fullName,
      mobile_no: a.phone, phone_country: a.phoneCountry,
      address: a.line1, address2: a.line2 ?? "",
      city: a.city, province: a.province, zip: a.zip, country: a.country,
    },
    product_items: input.items.map((i) => ({
      product_id: Number(i.aeProductId),
      sku_attr: i.skuAttr,
      product_count: i.quantity,
    })),
  };
  const payload = await callBusiness(env, "aliexpress.ds.order.create", token, {
    param_place_order_request4_open_api_d_t_o: JSON.stringify(request),
  });
  const result = payload?.result;
  if (!result?.is_success) throw new Error(`ds.order.create failed: ${result?.error_code ?? "unknown"} ${result?.error_msg ?? ""}`.trim());
  return list(result.order_list?.number).map(String);
}

/** Tracking + status for a supplier order. */
export async function getDsOrder(env: Env, token: string, aeOrderId: string) {
  const payload = await callBusiness(env, "aliexpress.trade.ds.order.get", token, {
    single_order_query: JSON.stringify({ order_id: aeOrderId }),
  });
  const r = payload?.result ?? {};
  const logistics = list(r.logistics_info_list?.ae_order_logistics_info)[0] as
    | { logistics_no?: string; logistics_service?: string }
    | undefined;
  return { status: String(r.order_status ?? ""), trackingNumber: logistics?.logistics_no, carrier: logistics?.logistics_service };
}
