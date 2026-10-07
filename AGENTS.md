# AGENTS.md — web-speed-test-server

## What this repo is (one line)
A deployable Node.js/Express backend service — the server side of Cloudinary's Website Speed Test — that takes a page URL, measures it via the WebPageTest.org API, and uploads each loaded image to Cloudinary to report per-image byte savings. It's a service you run, not a package you install.

## When to use this / when NOT to use this
- **Use this when:** you're deploying or modifying the API that powers the Website Speed Test (the `/test/*`, `/version`, `/locations` HTTP endpoints), or wiring it to WebPageTest and a Cloudinary product environment.
- **Do NOT use this when:** you want the browser UI (that's `cloudinary/web-speed-test-client`), or you're looking for a Cloudinary SDK to upload/transform assets in your own app (that's `cloudinary_npm` / `@cloudinary/url-gen`). This repo is `private: true` in `package.json` — it's not published to npm.
- **Architecture fact:** there's no local browser, Puppeteer, or Lighthouse here. The measurement engine is the external WebPageTest.org HTTP API; Cloudinary is used to analyze image savings. Both are called over HTTP.

## Setup
```bash
git clone https://github.com/cloudinary/web-speed-test-server.git
cd web-speed-test-server
yarn install          # Yarn 1 classic — postinstall runs patch-package
```
Required environment variables (read by `config/default.js` via `dotenv`; put them in `.env` at the repo root):
```bash
WTP_API_KEY=<wpt_key>          # WebPageTest API key(s), comma-separated; picked at random per run
CLOUDINARY_NAME=<cloud_name>
CLOUDINARY_API=<api_key>
CLOUDINARY_SEACRET=<api_secret> # NOTE: misspelled in source — set it exactly as written
PORT=5000                      # optional, default 5000
```

## Run
```bash
yarn start        # node --require ./instrumentation.js start.js — HTTP on PORT (default 5000)
```
The `--require ./instrumentation.js` flag loads OpenTelemetry before the app; a Prometheus metrics endpoint runs on port `6060`. The HTTP server socket timeout is 3 minutes to accommodate slow WebPageTest runs.

## Build / test commands (from CI — `.github/workflows/ci.yml`)
CI runs on Node `20.16`:
```bash
yarn install --immutable     # matches CI verbatim (Yarn 1 classic ignores --immutable; use --frozen-lockfile to actually enforce the lockfile)
WTP_API_KEY=mock yarn run test   # mocha suite; CI sets WTP_API_KEY=mock
```
`yarn run test` maps to `mocha` (see `package.json` scripts). Tests use mocha + chai + chai-http + sinon + nock (HTTP mocking), so they don't hit real WebPageTest or Cloudinary. Run a single spec file with mocha directly:
```bash
WTP_API_KEY=mock npx mocha test/wptTests.js   # test files: apiTests.js, cloudinaryTests.js, wptTests.js
```
There is **no lint script** and no lint workflow — don't invoke `yarn lint`.

## Conventions & gotchas
- **Package manager: Yarn 1 (classic).** Use `yarn`, not `npm`. The lockfile is `yarn.lock`; there's no `package-lock.json`. If `yarn` isn't on PATH: `corepack enable && corepack prepare yarn@1.22.22 --activate`.
- **`patch-package` postinstall.** The pinned `cloudinary` dependency is patched via `patches/cloudinary+2.9.0.patch`, applied on install. Bumping `cloudinary` means regenerating that patch.
- **`CLOUDINARY_SEACRET` is misspelled on purpose** in `config/default.js`. Set the env var with that spelling; don't "fix" it.
- **No `engines` field.** `package.json` declares no Node floor. CI pins `20.16`; the deps (`got` 14 ESM, OpenTelemetry, Express 4.22) need a modern Node (20). The upstream README's "Node v5 or newer" is wrong.
- **PR titles are semantic** (`.github/workflows/pr.yml`, `amannn/action-semantic-pull-request`). Allowed types: `fix`, `feat`, `chore`.
- **Releases are automated** via `release-please` (`.github/workflows/release.yml`, `release-type: node`) on push to `main`/`master`. Versioning follows Conventional Commits; a security-only fix is a PATCH bump.
- **Default branch is `master`.** Branch off `master` for changes.
- **OpenTelemetry packages move as a set.** Stable (`@opentelemetry/api`, `resources`, `sdk-trace-base`) are `1.x`/`2.x`; experimental (`exporter-prometheus`, `instrumentation-*`, `sdk-node`) are `0.x`. Bumping past `0.218.0` removes `new Resource({...})` — use `resourceFromAttributes({...})` in `instrumentation.js`.

## Repo already ships its own Claude skill — respect it
`.claude/skills/fix-dependency-security/SKILL.md` is the repo's own workflow for resolving yarn dependency vulnerabilities. Don't contradict it: keep Yarn 1 (not npm), `master` as the default branch, `patch-package` postinstall, no Chrome/chromedriver install step, and PATCH bumps for security-only fixes. Follow that skill for any dependency-security task.

## Key files
- `start.js` — entry point (`http.createServer(app)`, listens on `PORT`).
- `instrumentation.js` — OpenTelemetry setup, loaded before the app; Prometheus on `6060`.
- `app.js` — Express app: open CORS, JSON body parser, mounts `routes/wpt.js`, catch-all 404.
- `routes/wpt.js` — the HTTP routes (`/test/run`, `/test/:testId`, `/version`, `/locations`, `/locations/current`).
- `config/default.js` — all config, read from env vars.
- `wtp/` — WebPageTest client (`apiCaller.js`, `apiKey.js`, `locationSelector.js`).
- `cloudinary/apiCaller.js` — per-image Cloudinary upload + eager-transformation analysis.

## Canonical docs
- Cloudinary documentation: https://cloudinary.com/documentation
- Documentation llms.txt index: https://cloudinary.com/documentation/llms.txt

## Commit / PR conventions
- Branch off `master`; open PRs against `master`.
- PR titles follow Conventional Commits with type `fix`, `feat`, or `chore` (enforced in CI).
- Keep CI green: `yarn install --immutable` then `WTP_API_KEY=mock yarn run test` on Node 20.
