# Duolingo Unofficial Client

An unofficial TypeScript client for interacting with Duolingo web APIs.

> [!IMPORTANT]
> This project is unofficial and is not affiliated with, endorsed by, or
> sponsored by Duolingo.

Duolingo web endpoints are internal and may change without notice. Treat this
package as a community SDK around unstable web APIs, not an official API.

## Installation

```sh
npm install @duohacker/duolingo
```

## Basic Usage

```ts
import { DuolingoClient } from "@duohacker/duolingo";

const client = new DuolingoClient({
  token: process.env.DUOLINGO_TOKEN
});

const session = await client.auth.getTokenInformation();
const me = await client.users.getCurrent();
const leaderboard = await client.leaderboards.getCurrent();
const goalSchema = await client.goals.getSchema();
const goalProgress = await client.goals.getProgress();
const shopItems = await client.shop.listItems();

console.log(session.subject, me.username, leaderboard.entries.length, shopItems.length);
```

## Browser Usage

```ts
import { DuolingoClient } from "@duohacker/duolingo";

const client = new DuolingoClient({
  tokenProvider: async () => {
    return window.prompt("Paste a Duolingo JWT for this session only");
  }
});

const me = await client.users.getCurrent();
```

## Node.js Usage

Node.js 18 or newer is required.

```ts
import { DuolingoClient } from "@duohacker/duolingo";

const token = process.env.DUOLINGO_TOKEN;
const client = new DuolingoClient({ token });

console.log(await client.users.getCurrent());
```

## Custom Transport

The core package is not coupled to Tampermonkey or Violentmonkey. Userscripts
can provide a custom transport around `GM_xmlhttpRequest`; see
`examples/userscript.ts`.

## Authentication and Token Safety

- Pass tokens explicitly with `token` or lazily with `tokenProvider`.
- Tokens are kept in memory by default.
- The library never writes JWTs to `localStorage`.
- The library never writes authentication cookies.
- The library never logs tokens.
- Authorization headers are redacted by helper utilities.
- Relative requests resolve only against configured Duolingo API hosts.
- Absolute requests to non-allowlisted hosts are rejected.
- JWT decoding only reads claims; it does not verify signatures.

## Supported Modules

- `client.auth.getTokenInformation()`
- `client.users.getCurrent()`
- `client.users.getById(id)`
- `client.leaderboards.getCurrent()`
- `client.goals.getSchema()`
- `client.goals.getProgress()`
- `client.shop.listItems()`
- `client.courses.getCurrent()`

High-level modules are read-only in `0.1.0`. Mutation endpoints from the
reference userscript were intentionally excluded.

## Error Handling

The package throws typed errors:

- `DuolingoAuthError`
- `DuolingoHttpError`
- `DuolingoParseError`
- `DuolingoRateLimitError`
- `DuolingoConfigurationError`

Errors may include status, method, sanitized endpoint, and retry information.
They do not include JWTs, cookies, authorization values, or sensitive request
bodies.

## API Stability Warning

The endpoints used here were identified from an existing userscript and are not
officially documented by Duolingo. Response shapes can change at any time.
Schema validation is intentionally conservative and accepts unknown extra fields.

## Contributing

Please keep the package neutral, read-only by default, and safe for general
applications. Do not add XP farming, gem farming, quest forcing, lesson solving,
subscription spoofing, or account-token persistence features.

## License

MIT
