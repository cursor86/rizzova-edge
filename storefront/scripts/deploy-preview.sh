#!/usr/bin/env bash
# Preview deploy: build with OpenNext, upload static files to KV, deploy the KV-backed entry.
# Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment.
set -euo pipefail
cd "$(dirname "$0")/.."
NS=$(node -e "const c=require('fs').readFileSync('wrangler.preview.jsonc','utf8');console.log(c.match(/\"id\":\s*\"([0-9a-f]+)\"/)[1])")
rm -rf .open-next
NEXT_TELEMETRY_DISABLED=1 npx opennextjs-cloudflare build
python3 - <<'PY' > .open-next/kv-bulk.json
import os, json, base64, mimetypes
root = ".open-next/assets"; items = []
for d, _, fs in os.walk(root):
    for f in fs:
        p = os.path.join(d, f); key = os.path.relpath(p, root)
        ct = mimetypes.guess_type(f)[0] or ("text/javascript" if f.endswith(".js") else "application/octet-stream")
        if f.endswith(".woff2"): ct = "font/woff2"
        items.append({"key": key, "value": base64.b64encode(open(p, "rb").read()).decode(), "base64": True, "metadata": {"ct": ct}})
print(json.dumps(items))
PY
curl -sS -X PUT "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/storage/kv/namespaces/${NS}/bulk" \
  -H "content-type: application/json" -H "authorization: Bearer ${CLOUDFLARE_API_TOKEN}" --data-binary @.open-next/kv-bulk.json \
  | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success'], d; print('static files uploaded:', d['result']['successful_key_count'])"
npx wrangler deploy -c wrangler.preview.jsonc
