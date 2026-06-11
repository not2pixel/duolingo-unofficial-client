# Node.js CLI Demo

This demo reads the current Duolingo profile with the local
`@duohacker/duolingo` package.

## Authentication

Set the JWT in the shell environment. Do not pass it as a CLI argument.

PowerShell:

```powershell
$env:DUOLINGO_TOKEN = "your_duolingo_jwt_here"
npm run demo:node
```

Bash:

```sh
DUOLINGO_TOKEN="your_duolingo_jwt_here" npm run demo:node
```

JSON output:

```sh
npm run demo:node -- --json
```

The demo does not read `.env` automatically. `demos/node/.env.example` is only a
template.

## Safety

- No real JWT is committed.
- The JWT is never printed.
- JSON output contains only safe profile fields.
- The CLI is read-only.
