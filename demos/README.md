# Demos

> [!IMPORTANT]
> These demos are unofficial and are not affiliated with, endorsed by, or
> sponsored by Duolingo.

This folder contains complete read-only demonstrations for the existing
`@duohacker/duolingo` TypeScript library.

## Demo Overview

- `demos/userscript`: a Tampermonkey/Violentmonkey userscript that runs on
  Duolingo pages and uses `GM_xmlhttpRequest`.
- `demos/node`: a Node.js CLI that reads `DUOLINGO_TOKEN` from the environment.
- `demos/web`: a vanilla HTML/CSS/JavaScript site with Vercel Functions as the
  backend proxy.

None of the demos implement XP farming, gem farming, quest mutation, account
modification, subscription bypass, lesson solving, or fake lesson/story
completion.

## Installation

From the repository root:

```sh
npm install
```

The repository uses npm workspaces for the Vercel web demo. The demo package
uses npm's local `file:../..` dependency syntax because this environment's npm
does not accept the `workspace:*` protocol. It still consumes the current local
`@duohacker/duolingo` package without requiring a published npm release.

## Commands

```sh
npm run demo:userscript:build
npm run demo:node
npm run demo:node -- --json
npm run demo:web
npm run demo:web:typecheck
npm run demo:web:test
npm run demos:check
```

`npm run demos:check` uses mocks and does not make live Duolingo requests.

## Authentication Differences

- Userscript: asks the user to paste a JWT and keeps it in memory only.
- Node CLI: reads `DUOLINGO_TOKEN` from the shell environment.
- Vercel web: reads `DUOLINGO_TOKEN` on the server-side Function.

No demo commits a real JWT, logs JWTs, or stores JWTs in source control.

## CORS Behavior

A standalone browser page generally cannot call Duolingo APIs directly because
browser CORS rules apply. Each demo avoids that differently:

- The userscript uses `GM_xmlhttpRequest` with explicit `@connect` metadata.
- The Node.js CLI is not subject to browser CORS.
- The Vercel browser frontend calls same-origin Vercel Functions with
  `fetch("/api/me")`.
- The Vercel Functions call Duolingo from the server-side runtime.
- The Duolingo JWT is never sent to the browser.

No wildcard CORS policy is used and no generic external proxy is exposed.

## Vercel Deployment

See `demos/web/README.md` for dashboard and CLI deployment steps. The web demo
requires these environment variables in Vercel:

- `DUOLINGO_TOKEN`
- `DEMO_ACCESS_KEY`

`DEMO_ACCESS_KEY` protects the demo endpoint; it is not a Duolingo credential.

## Troubleshooting

- Missing token: set `DUOLINGO_TOKEN` in your shell or Vercel environment.
- Invalid demo access key: enter the value configured in `DEMO_ACCESS_KEY`.
- Rate limits: wait before retrying.
- Upstream errors: Duolingo internal web endpoints may change without notice.
- Userscript connection errors: confirm the userscript manager has permission to
  connect to `duolingo.com`.
