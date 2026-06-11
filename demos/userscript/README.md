# Userscript Demo

This demo builds a Tampermonkey/Violentmonkey userscript that runs on Duolingo
pages and reads the current profile through `@duohacker/duolingo`.

It asks for a Duolingo JWT when you press **Connect**, keeps that token only in
memory, and clears it when you disconnect or reload the page. It does not patch
`fetch`, `XMLHttpRequest`, or any Duolingo page behavior.

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
