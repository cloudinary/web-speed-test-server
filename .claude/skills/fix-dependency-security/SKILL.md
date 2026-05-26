---
name: fix-dependency-security
description: >-
  Fix yarn dependency security vulnerabilities in this repo's package.json.
  Use when the user mentions fixing dependencies, security vulnerabilities,
  yarn audit, dependency updates, JIRA vulnerability tickets, or CVEs.
---

# Fix Dependency Security Vulnerabilities

Workflow for resolving security vulnerabilities reported via JIRA in
`web-speed-test-server`.

## Project facts

- **Package manager**: yarn 1 (classic). Use `yarn`, not `npm`. The lockfile is
  `yarn.lock`. There is no `package-lock.json`.
  - If `yarn` is not on PATH, activate it with `corepack enable && corepack prepare yarn@1.22.22 --activate`.
- **Yarn equivalent of `overrides`** is `resolutions`. This project currently
  has neither — transitive vulns are usually resolved by bumping the parent
  direct dependency rather than pinning a transitive.
- **Postinstall**: runs `patch-package` only. There is **no** Chrome/chromedriver
  install step (unlike the cdn repo this skill was originally written for).
- **Test command**: `npm test` (which just runs `mocha`).
- **Default branch**: `master`.
- **Version**: standard semver (e.g. `1.3.12`). The minor does **not** track
  Chrome — a security-only fix is a PATCH bump.

## Input

The user provides one or more vulnerabilities to fix. Each includes:
- **JIRA ticket ID** (e.g., DELO-1234)
- **Affected package name** (often transitive)
- **Minimum safe version**

When multiple vulnerabilities are provided, resolve them in a **single branch,
commit, and PR**.

## Workflow

Follow these steps in order. Use the todo list to track progress.

### Step 1: Save current resolutions

Record the current `resolutions` block (and any `overrides`, in case a future
contributor added one) before changing anything:

```bash
node -e "const p=require('./package.json'); console.log('resolutions:', JSON.stringify(p.resolutions, null, 2)); console.log('overrides:', JSON.stringify(p.overrides, null, 2))"
```

If both are `undefined` (the current baseline), there's nothing to restore in
Step 4 — but still check.

### Step 2: Update direct dependencies

1. Remove any `resolutions` / `overrides` blocks from `package.json`.
2. List outdated direct deps:

```bash
yarn outdated
```

3. Update each direct dependency in `package.json`. For major bumps, read the
   changelog first. Packages with extra-care histories in this repo:
   - `@opentelemetry/*` — the experimental (`0.x`) and stable (`1.x`/`2.x`)
     packages move as a set. Bumping `@opentelemetry/exporter-prometheus` past
     `0.218.0` pulls in `@opentelemetry/resources@^2`, which **removes**
     `new Resource(attributes)`. Switch to `resourceFromAttributes(attributes)`
     in `instrumentation.js`.
   - `express` 4 → 5, `chai` 4 → 5+, `got` 14 → 15, `sinon` 19 → 22+,
     `dotenv` 16 → 17, `config` 3 → 4, `rollbar` 2 → 3 — all have breaking
     changes; do not bump these as part of a security-only PR unless required.
   - `cloudinary` has a `patches/cloudinary+<ver>.patch` file applied via
     `patch-package`. Bumping it requires regenerating the patch.

Find the latest version of a package with:

```bash
npm info <package> version
```

### Step 3: Fresh install

```bash
rm -rf node_modules yarn.lock
yarn install
```

Verify the install completes. `warning` lines are acceptable; `error` lines
must be investigated.

### Step 4: Restore necessary resolutions

**Never** use `yarn audit` to decide whether a resolution should be restored.
Resolutions exist because a prior security review chose a minimum safe version.
The **only** criterion: does any installed copy of the package fall below the
previously-pinned version?

For each package recorded in Step 1, check the installed versions across the
full tree. `yarn list --pattern` collapses to top-level results, so prefer
`npm ls` for transitive visibility:

```bash
npm ls <package-name> --all
```

If any copy is below the saved version, add it back to `resolutions`. Choose
the highest version that:
- Is >= the saved version
- Doesn't cross a major boundary on a peer dependency

Then re-install:

```bash
rm -rf node_modules yarn.lock
yarn install
```

Confirm with `npm ls <package-name> --all` that every copy is at or above the
pinned version.

### Step 5: Resolve the reported vulnerabilities

For each JIRA ticket / package / min-version tuple:

```bash
npm ls <vulnerable-package> --all
```

If any installed copy is **below** the required minimum:
1. If the package is a **direct** dependency, bump it in `dependencies` or
   `devDependencies`.
2. Otherwise, prefer bumping the **parent direct dep** that brings it in
   (check with `npm ls <package> --all`). Only fall back to a `resolutions`
   entry if no parent bump produces a safe transitive version.

Apply **all** changes for **all** vulnerabilities before re-installing. Then
one fresh install:

```bash
rm -rf node_modules yarn.lock
yarn install
```

Verify each vulnerable package:

```bash
npm ls <package> --all
```

### Step 6: Validate

Run the test suite:

```bash
npm test
```

What to look for:
- **Hard crashes** (uncaught exceptions, module-resolution errors) = **FAIL**.
  Investigate and fix.
- Individual assertion failures = OK if pre-existing; otherwise investigate.

Also smoke-test the OpenTelemetry boot path if `@opentelemetry/*` packages were
touched (the v2 Resource API change is easy to miss):

```bash
node --require ./instrumentation.js -e "console.log('boot OK'); setTimeout(()=>process.exit(0), 2000)"
```

If validation fails, identify the offending dependency, adjust, re-install,
re-validate.

### Step 7: Bump package version

Read the current version from `package.json`. Security-only fixes always
increment **PATCH**:

- `1.3.11` → `1.3.12`

Update the `version` field in `package.json`.

### Step 8: Commit, push, and open PR

1. Create a branch from `master`:

```bash
# Single JIRA:
git checkout -b <JIRA-ID>/security-fixes

# 2-3 JIRAs (underscore-joined, sorted):
git checkout -b <JIRA-ID-1>_<JIRA-ID-2>/security-fixes

# 4+ JIRAs — use the first JIRA only:
git checkout -b <JIRA-ID-1>/security-fixes
```

2. Stage and commit. Don't `git add -A` — be explicit:

```bash
git add package.json yarn.lock <any-other-changed-files>
git commit -m "<JIRA-ID-1>, <JIRA-ID-2>: fix dependency security vulnerabilities"
```

3. Push:

```bash
git push -u origin HEAD
```

4. Open the PR:

```bash
gh pr create --title "<JIRA-IDs>: fix dependency security vulnerabilities" --body "$(cat <<'EOF'
## Summary

### Vulnerabilities resolved
- **<package>**: <old> → <new> (minimum required: <min>, from <JIRA-ID>)

### Dependencies updated
- `<package>`: <old> → <new>

### Code changes
- `<file>`: <what changed and why> (omit this section if no source files changed)

### Resolutions
- `<package>`: <version> — <reason / JIRA-ID> (or "None added" if not needed)

### Package version
- `<old>` → `<new>`

### Test results
- `npm test` passed — no hard crashes or module errors.
- OpenTelemetry boot smoke-tested OK (if `@opentelemetry/*` was touched).

## Test plan
- [ ] `npm test` passes
- [ ] App boots cleanly: `node --require ./instrumentation.js start.js` (Prometheus exporter on :6060)
EOF
)"
```

## Critical rules

### Resolutions: never downgrade

A `resolutions` entry was put there for a reason. Never drop or lower one based
on `yarn audit` / `npm audit` output. The only criterion to remove or change it
is: every installed copy of the package is already at or above the pinned
version *without* the resolution.

### Resolutions and peer dependencies

A `resolutions` entry that crosses a major boundary on a peer dependency will
break things. After adding one, run `npm ls <package> --all` and look for
`WARN`/`ERR` lines on peer deps. If you see them, pick a version inside the
compatible major range instead.

### Prefer direct-dep bumps over resolutions

For transitive vulnerabilities, first try bumping the parent direct dependency.
A clean direct-dep bump avoids carrying a permanent `resolutions` pin that
future contributors won't understand.

### OpenTelemetry note

The OpenTelemetry JS ecosystem is split:
- Stable packages (`@opentelemetry/api`, `resources`, `sdk-trace-base`,
  `semantic-conventions`) versioned `1.x` / `2.x`.
- Experimental packages (`exporter-prometheus`, `instrumentation-*`,
  `sdk-node`) versioned `0.x`.

They must move as a set. The `0.218.0` experimental line depends on stable
`2.x` packages, which changed the Resource API: replace `new Resource({...})`
with `resourceFromAttributes({...})` in `instrumentation.js`.

### Branch naming

Always from `master`.

- 1 JIRA: `<JIRA-ID>/security-fixes`
- 2–3 JIRAs: `<JIRA-ID-1>_<JIRA-ID-2>/security-fixes` (sorted)
- 4+ JIRAs: `<JIRA-ID-1>/security-fixes` (first only)

### Pull request

Title:
- 1 JIRA: `<JIRA-ID>: fix dependency security vulnerabilities`
- 2+ JIRAs: comma-separate every ID — `DELO-A, DELO-B, ...: fix dependency security vulnerabilities`

Body sections (omit any that don't apply, but never silently drop one that does):
- **Vulnerabilities resolved** — one bullet per JIRA: ID, package, old, new, min required
- **Dependencies updated** — every direct dep that changed, old → new
- **Code changes** — any non-`package.json`/`yarn.lock` file that changed, and why
- **Resolutions** — added/removed/changed entries with reason, or "None added"
- **Package version** — old → new
- **Test results** — confirm `npm test` had no hard crashes
- **Test plan** — checklist
