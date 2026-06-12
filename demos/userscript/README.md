# Userscript Demo

This demo builds a Tampermonkey/Violentmonkey userscript that runs on Duolingo
pages and reads the current profile through `@duohacker/duolingo`.

It can read the current page's visible `jwt_token` cookie with **Use Page Login**,
or ask for a Duolingo JWT when you press **Connect**. The token is kept only in
memory and clears when you disconnect or reload the page. You may paste the raw
`jwt_token` value, `jwt_token=...`, a URL-encoded cookie value, or an
`Authorization: Bearer` value. It does not patch `fetch`, `XMLHttpRequest`, or
any Duolingo page behavior.

## Build

```sh
npm run demo:userscript:build
```

Install the generated file:

```text
demos/userscript/build/duolingo-client-demo.user.js
```

The generated bundle is committed intentionally so the demo is installable
without rebuilding, but it should be regenerated after source changes.

## Safety

- No real JWT is included.
- Tokens are not written to storage.
- Authorization headers are never logged.
- Only read-only profile data is displayed.

## Troubleshooting

- If the panel does not appear, confirm the script is enabled on
  `https://*.duolingo.com/*` or `https://*.duolingo.cn/*`.
- If requests fail immediately, confirm the userscript manager granted
  `GM_xmlhttpRequest` or `GM.xmlHttpRequest` and the explicit `@connect` hosts.
- If authentication fails, click **Use Page Login** while logged in to Duolingo,
  or paste only the JWT-like value with three dot-separated parts. The demo also
  accepts `jwt_token=...` and `Bearer ...` values and normalizes them.
