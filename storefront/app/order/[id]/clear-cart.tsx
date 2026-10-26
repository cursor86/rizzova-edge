"use client";

import { useEffect } from "react";
import { useCart } from "@/context/cart-context";

/** Empties the cart once the customer lands back from a completed payment. */
export function ClearCart() {
  const { clear } = useCart();
  useEffect(() => clear(), [clear]);
  return null;
}
