---
name: run-routesync
description: Build, test, and run RouteSync against the toko-online Laravel project — scan routes, generate typed SDK, validate output
---

All paths below are relative to the repo root unless stated otherwise.

## What this is

RouteSync is a Node.js CLI + library that syncs Laravel routes to a
fully-typed TypeScript frontend SDK. The **driver**
`.claude/skills/run-routesync/driver.mjs` connects to the real
`C:\Users\User\toko-online` Laravel project: it scans routes via PHP,
generates the SDK into the Next.js frontend, runs the test suite, and
validates library exports.

## Prerequisites

```bash
# Node.js >= 20
node -v

# PHP >= 8.0 on PATH (for scan --models)
php -v

# No system packages required
```

## Build

```bash
npm install
npm run build      # tsup → dist/ (CJS + ESM for each package)
```

## Run (agent path) — the driver

```bash
# From the repo root:
node .claude/skills/run-routesync/driver.mjs
```

The driver runs these steps:

1. **Build routesync** (`npx tsup`) — skip with `--skip-build`
2. **Test suite** (`npx vitest run`) — skip with `--skip-test`
3. **Scan toko-online** (`routesync scan --models`) — reads
   `C:\Users\User\toko-online\routes\api.php` + 20 Eloquent models via PHP,
   outputs `routesync.manifest.json`. Skip with `--skip-scan`
4. **Generate SDK** — `routesync generate` from the manifest into
   `C:\Users\User\toko-online\frontend\src\api\` with `--next-actions`
   and `--zod`. Verifies all generated files and checks for real toko-online
   endpoints (produk, login, register, cart, orders, wishlist, checkout)
5. **CLI help/version** — verifies `--help` and `--version`
6. **Library imports** — `require()`s the SDK CJS bundle, exercises
   `defineApi()`, `endpoint()`, `toCamelCase()`, `toSnakeCase()`

### Options

| Flag | Effect |
|------|--------|
| `--skip-build` | Skip tsup (use when dist/ is current) |
| `--skip-test`  | Skip vitest |
| `--skip-scan`  | Skip Laravel scan (use existing manifest) |
| `--smoke-only` | Library + help/version only |

### Configuring paths

Edit the constants at the top of `driver.mjs` if your toko-online project is
at a different location:

```js
const TOKO_ONLINE = 'C:\\Users\\User\\toko-online'
const TOKO_ROUTES = 'routes/api.php'
const TOKO_OUTPUT = 'frontend/src/api'
const TOKO_BASE_URL = 'http://localhost:8000/api'
```

## Run (human path)

The full workflow from scratch:

```bash
# 1. In the toko-online Laravel project:
cd C:\Users\User\toko-online
node ..\..\routesync\dist\cli.js annotate --input routes/api.php --dry-run
node ..\..\routesync\dist\cli.js scan --input routes/api.php --models --baseURL http://localhost:8000/api

# 2. In the toko-online frontend:
node ..\..\routesync\dist\cli.js generate --manifest routesync.manifest.json --output frontend/src/api --next-actions --zod
```

## Direct invocation (library)

For PRs that touch the SDK or core packages without changing the CLI:

```js
// ESM
import { defineApi, endpoint, toCamelCase } from './dist/sdk.mjs'

// CJS
const { defineApi, endpoint, toCamelCase } = require('./dist/sdk.js')

const api = defineApi({
  produk: {
    list: endpoint({ method: 'GET', path: '/produk' }),
  },
})
console.log(toCamelCase({ user_name: 'x' }).userName) // → 'x'
```

## Test

```bash
npm test
npx vitest run     # equivalent
```

3 tests across 2 files:
- `packages/sdk/tests/queryKey.spec.ts`
- `packages/sdk/tests/constants.spec.ts`
- `packages/react/tests/type-inference/type-audit.type-spec.ts`

## Gotchas

- **`generate` says `types.ts` but writes `types/`**: The status line prints
  `types.ts` for readability, but actual files are `types/api-read.ts`,
  `types/api-form.ts`, `types/index.ts`. The flat `types.ts` does **not** exist.
- **`hooks.ts` uses `defineHooks`, not `useApiQuery`**: The generated file
  exports per-resource hooks (`useProduk`, `useCartItems`, etc.) built on
  the `defineHooks` registry. `useApiQuery` is deprecated but still importable.
- **`mapKeysDeep` takes a string, not a function**: `mapKeysDeep(obj, 'camel')`
  or `mapKeysDeep(obj, 'snake')`. Prefer `toCamelCase()`/`toSnakeCase()`.
- **`scan --models` requires PHP + database**: The scanner runs a temporary PHP
  script via Laravel's bootstrap to call `Schema::getColumns()`. If the
  database is unreachable, `--models` will fail. Routes alone still scan fine
  without it.
- **PowerShell backslash continuation**: `\` is a parser error. Use single-line
  commands or PowerShell here-strings.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Cannot find module '...dist/cli.js'` | Run `npm run build` |
| `Manifest not found` | Run `routesync scan` first, or pass absolute path |
| `vitest: command not found` | Run `npm install` |
| `scan` shows "Response type could not be inferred" | Expected for endpoints that don't return a JsonResource. Annotate with `#[Response]` to fix. |
| `php: command not found` | Install PHP >= 8.0 and add to PATH |
