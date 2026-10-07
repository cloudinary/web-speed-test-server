# web-speed-test-server

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/cloudinary/web-speed-test-server/blob/master/LICENSE)
[![CI](https://github.com/cloudinary/web-speed-test-server/actions/workflows/ci.yml/badge.svg)](https://github.com/cloudinary/web-speed-test-server/actions/workflows/ci.yml)

The backend service for Cloudinary's Website Speed Test image performance tool. It's a deployable Node.js/Express server (not an installable package), run on Node 20. It takes a page URL, drives a load-and-render measurement through the WebPageTest.org API, then uploads each image the page loaded to Cloudinary with a set of eager transformations to report the byte savings you'd get from `q_auto` and modern formats (WebP, AVIF, JP2, JPEG XR, PNG).

## Setup

Clone the repo, install with Yarn 1 (the lockfile is `yarn.lock`; there's no `package-lock.json`), and run on Node 20:

```bash
git clone https://github.com/cloudinary/web-speed-test-server.git
cd web-speed-test-server
yarn install
```

`yarn install` runs a `patch-package` postinstall step that patches the pinned `cloudinary` dependency, so install with Yarn rather than npm.

## Configuration

The server reads its config from environment variables (via `dotenv` — put them in a `.env` file at the repo root, or export them). The Cloudinary and WebPageTest variables are read in `config/default.js`; `PORT` is read in `start.js`:

| Variable | Purpose |
|---|---|
| `WTP_API_KEY` | WebPageTest.org API key. Accepts a comma-separated list; one key is picked at random per test run. Defaults to `dummy`, which won't run real tests. |
| `CLOUDINARY_NAME` | Cloudinary cloud name. |
| `CLOUDINARY_API` | Cloudinary API key. |
| `CLOUDINARY_SEACRET` | Cloudinary API secret. |
| `PORT` | HTTP listen port. Defaults to `5000`. |

Note the variable name `CLOUDINARY_SEACRET` is misspelled in the source (`config/default.js` reads `process.env.CLOUDINARY_SEACRET`). Set it with that exact spelling — "correcting" it to `CLOUDINARY_SECRET` leaves the API secret undefined and breaks the Cloudinary calls.

A Prometheus metrics endpoint (OpenTelemetry) is also served on port `6060`, separate from the HTTP API.

Keep the API secret and WebPageTest key out of client-side code and out of version control.

```bash
# .env at the repo root
WTP_API_KEY=<WPT_KEY_1>,<WPT_KEY_2>
CLOUDINARY_NAME=<CLOUD_NAME>
CLOUDINARY_API=<API_KEY>
CLOUDINARY_SEACRET=<API_SECRET>
PORT=5000
```

Start the server:

```bash
yarn start
```

That runs `node --require ./instrumentation.js start.js` — the instrumentation module loads first to set up OpenTelemetry, then the Express app listens on `PORT` (default `5000`).

## API

The server exposes a JSON HTTP API (CORS is open to all origins). The examples below assume it's running on `http://localhost:5000`.

### Start a test

`POST /test/run` starts a WebPageTest run for a URL. Body: `url` (required) and optional `mobile` (boolean, toggles mobile emulation). It returns a `testId` you poll for results:

```bash
curl -X POST http://localhost:5000/test/run \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com","mobile":false}'
```

```json
{ "status": "success", "data": { "testId": "250719_AbC_123" } }
```

A missing body or missing `url` returns HTTP 400.

### Get test results

`GET /test/:testId` polls WebPageTest for the run, and once it's done, uploads each image the page loaded to Cloudinary and returns the per-image savings analysis. The optional `quality` query parameter maps to Cloudinary's `q_auto:<quality>` for the analysis:

```bash
curl 'http://localhost:5000/test/250719_AbC_123?quality=80'
```

While the run is still in progress it returns a not-finished marker — poll again:

```json
{ "status": "success", "message": "test not finished", "code": 150 }
```

When the run is done, it returns `{ "status": "success", "data": { ... } }` with the analyzed image payload.

### Get the server version

`GET /version` returns the running server version from `package.json`:

```bash
curl http://localhost:5000/version
```

```json
{ "version": "1.3.12" }
```

### List WebPageTest locations

`GET /locations` returns the cached list of WebPageTest agent locations used by the location selector. `GET /locations/current` returns the currently selected location and when it was last refreshed. Both are populated only when the location selector is enabled (`WTP_LS_ENABLED=true`); otherwise the list is empty and the timestamp is the epoch:

```bash
curl http://localhost:5000/locations
curl http://localhost:5000/locations/current
```

```json
{ "location": "IAD_US_01", "lastUpdated": "1970-01-01T00:00:00.000Z" }
```

## For AI agents

This repo is the **server** half of Cloudinary's Website Speed Test — a deployable Express service that orchestrates WebPageTest.org and the Cloudinary SDK to measure per-image performance. It does not run a browser or Lighthouse locally; the measurement engine is the external WebPageTest.org API. Pick the right piece:

| You want | Go to |
|---|---|
| The backend/API service (this repo) | `cloudinary/web-speed-test-server` |
| The browser UI that calls this API | [`cloudinary/web-speed-test-client`](https://github.com/cloudinary/web-speed-test-client) |
| The hosted tool, no setup | Cloudinary Website Speed Test <!-- [verify] public tool URL not asserted in repo source --> |

## Links

- [Repository](https://github.com/cloudinary/web-speed-test-server)
- [web-speed-test-client (frontend)](https://github.com/cloudinary/web-speed-test-client)
- [Cloudinary documentation](https://cloudinary.com/documentation)
- [Documentation llms.txt index](https://cloudinary.com/documentation/llms.txt)

Released under the MIT license.
