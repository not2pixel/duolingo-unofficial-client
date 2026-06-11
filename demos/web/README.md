# Vercel Web Demo

This is a vanilla HTML/CSS/JavaScript site with Vercel Functions as the backend.
The browser calls only same-origin routes such as `/api/me`; it never calls
Duolingo directly and never receives the Duolingo JWT.

## Architecture

```text
Browser
  -> GET /api/me
  -> Vercel Function
  -> @duohacker/duolingo
  -> Duolingo web API
```

## Local Development

Create a local env file that is ignored by Git:

```sh
cp demos/web/.env.example demos/web/.env
```

Fill in local values, then run from the repository root:

```sh
npm run demo:web
```

This starts `vercel dev demos/web` from the repository root. It does not start a
custom Express server.

## Environment Variables

- `DUOLINGO_TOKEN`: server-side Duolingo JWT used by the Function.
- `DEMO_ACCESS_KEY`: optional shared access key for `/api/me`.

When `DEMO_ACCESS_KEY` is configured, the frontend sends it in
`X-Demo-Access-Key`. The key is kept only in JavaScript memory. It is not stored
in `localStorage`, `sessionStorage`, cookies, or URLs.

If `DEMO_ACCESS_KEY` is not configured, `/api/me` is callable by anyone who can
reach the deployment. That may be acceptable for local development, but it is
not recommended for production.

Environment-variable changes in Vercel require a new deployment before the new
values are used.

## Vercel Dashboard Deployment

Because the web package consumes the local package through `file:../..`,
configure Vercel to install from this repository rather than from a published
npm package. The verified Vercel project root is `demos/web`.

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Root Directory: `demos/web`.
4. Install Command: `npm install`.
5. Build Command: `npm run build`.
6. Development Command: leave blank. Use `npm run demo:web` locally from the repository root.
7. Add `DUOLINGO_TOKEN` as a sensitive Environment Variable.
8. Add `DEMO_ACCESS_KEY` as a sensitive Environment Variable.
9. Add variables to Preview and Production as appropriate.
10. Redeploy after changing environment variables.
11. Verify `/api/health`.
12. Open the deployed site.
13. Enter the demo access key.
14. Load the profile.

For static routing and Function discovery, deploy from `demos/web` with the
Vercel CLI when possible. The checked configuration uses `demos/web/vercel.json`.

## Vercel CLI Deployment

From the repository root:

```sh
npm install
npm run build
cd demos/web
vercel login
vercel link
vercel env add DUOLINGO_TOKEN
vercel env add DEMO_ACCESS_KEY
cd ../..
npm run demo:web
cd demos/web
vercel
vercel --prod
```

Do not paste actual secret values into documentation, issue trackers, or source
files.

## Safety

- `/api/me` returns only sanitized profile fields.
- API responses use `Cache-Control: no-store`.
- No generic Duolingo proxy is exposed.
- No wildcard CORS headers are used.
- Avatar URLs are accepted only when they use `https:`.
