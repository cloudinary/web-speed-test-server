@AGENTS.md

# CLAUDE.md — web-speed-test-server

## Claude Code-specific notes

**Primary reference:** `AGENTS.md` (imported above) covers setup, run, build/test commands, conventions, and gotchas. Read it before touching any file.

This repo already ships a `.claude/` directory (`.claude/skills/fix-dependency-security/`). This file is additive — it doesn't replace or conflict with that skill. For any dependency-security or CVE/JIRA task, use the repo's `fix-dependency-security` skill and follow it exactly.

## What this repo is

A deployable Node.js/Express service — the backend for Cloudinary's Website Speed Test. It takes a page URL, measures it through the external WebPageTest.org API, and uploads each loaded image to Cloudinary to report per-image byte savings. It's a service you run, not a package you install (`package.json` is `private: true`).

## Key constraints

- **Yarn 1 (classic), not npm.** Lockfile is `yarn.lock`; there's no `package-lock.json`. `postinstall` runs `patch-package`.
- **Node 20** (CI pins `20.16`). No `engines` field in `package.json`; the upstream README's "Node v5" is wrong.
- **`CLOUDINARY_SEACRET`** is the literal (misspelled) env var name in `config/default.js`. Don't correct it.
- **No lint script.** Don't run `yarn lint` — it doesn't exist.
- **Default branch: `master`.** PR titles are semantic (`fix`/`feat`/`chore`); releases are automated via `release-please`.
- **No local browser.** Measurement is the external WebPageTest.org API; there's no Puppeteer/Lighthouse/chromedriver here.

## Verified run + test commands

```bash
yarn install                       # Yarn 1; runs patch-package postinstall
yarn start                         # node --require ./instrumentation.js start.js — HTTP on PORT (5000)

# Tests (CI: Node 20.16)
yarn install --immutable           # exact CI install
WTP_API_KEY=mock yarn run test     # mocha suite (CI sets WTP_API_KEY=mock)
WTP_API_KEY=mock npx mocha test/wptTests.js   # single test file (also apiTests.js, cloudinaryTests.js)
```

`yarn run test` maps to `mocha`. Tests mock HTTP via `nock`, so they don't call real WebPageTest or Cloudinary.
