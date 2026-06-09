#!/usr/bin/env node
/**
 * RouteSync driver — builds routesync, scans the toko-online Laravel project,
 * generates a typed SDK into its Next.js frontend, runs tests, and validates
 * library imports.
 *
 *   node .claude/skills/run-routesync/driver.mjs
 *
 * Options:
 *   --skip-build     Skip the tsup build step
 *   --skip-test      Skip the vitest suite
 *   --skip-scan      Skip the Laravel scan (use existing manifest)
 *   --smoke-only     Library + help/version only (no scan, no build, no test)
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..', '..', '..')

// ═══ Configure these paths for your environment ═══
const TOKO_ONLINE = 'C:\\Users\\User\\toko-online'
const TOKO_ROUTES = 'routes/api.php'
const TOKO_OUTPUT = 'frontend/src/api'
const TOKO_BASE_URL = 'http://localhost:8000/api'
// ═══════════════════════════════════════════════════

const args = new Set(process.argv.slice(2))
const SKIP_BUILD = args.has('--skip-build')
const SKIP_TEST = args.has('--skip-test')
const SKIP_SCAN = args.has('--skip-scan')
const SMOKE_ONLY = args.has('--smoke-only')

const CLI = join(repoRoot, 'dist', 'cli.js')

if (!existsSync(TOKO_ONLINE)) {
  console.error(`\x1b[31mToko-online project not found at: ${TOKO_ONLINE}\x1b[0m`)
  console.error('Edit the TOKO_ONLINE path at the top of this file.')
  process.exit(1)
}

let failures = 0

function log(level, msg) {
  const icons = { info: '•', ok: '✔', fail: '✘', hdr: '▶' }
  const prefix = icons[level] || ' '
  if (level === 'fail') failures++
  const color = { ok: '\x1b[32m', fail: '\x1b[31m', hdr: '\x1b[1;36m' }[level] || '\x1b[0m'
  console.log(`${color}${prefix}\x1b[0m ${msg}`)
}

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: opts.quiet ? 'pipe' : 'inherit', ...opts })
  } catch (e) {
    if (!opts.ignoreError) throw e
    return e.stdout || ''
  }
}

function check(filePath, description, expectContent) {
  if (!existsSync(filePath)) {
    log('fail', `${description} MISSING — ${filePath}`)
    return false
  }
  if (expectContent) {
    const content = readFileSync(filePath, 'utf8')
    if (!content.includes(expectContent)) {
      log('fail', `${description} — expected "${expectContent}" not found`)
      return false
    }
  }
  log('ok', description)
  return true
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Build routesync
// ═══════════════════════════════════════════════════════════════════════════
if (!SKIP_BUILD && !SMOKE_ONLY) {
  log('hdr', 'Build routesync (tsup)')
  run('npx tsup', { cwd: repoRoot })
  check(join(repoRoot, 'dist/cli.js'), 'CLI bundle')
  check(join(repoRoot, 'dist/sdk.mjs'), 'SDK ESM bundle')
  check(join(repoRoot, 'dist/core.mjs'), 'Core ESM bundle')
  console.log('')
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Test suite
// ═══════════════════════════════════════════════════════════════════════════
if (!SKIP_TEST && !SMOKE_ONLY) {
  log('hdr', 'Test suite (vitest)')
  run('npx vitest run', { cwd: repoRoot })
  console.log('')
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Scan toko-online Laravel routes → manifest
// ═══════════════════════════════════════════════════════════════════════════
if (!SKIP_SCAN && !SMOKE_ONLY) {
  log('hdr', `Scan: ${TOKO_ONLINE}/${TOKO_ROUTES}`)
  run(`node "${CLI}" scan --input ${TOKO_ROUTES} --models --baseURL ${TOKO_BASE_URL}`, {
    cwd: TOKO_ONLINE,
    ignoreError: false,
  })
  const manifestPath = join(TOKO_ONLINE, 'routesync.manifest.json')
  check(manifestPath, 'Manifest generated → routesync.manifest.json')
  check(manifestPath, 'Has routes array', '"routes"')
  check(manifestPath, 'Has models array', '"models"')
  console.log('')
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Generate typed SDK → toko-online frontend
// ═══════════════════════════════════════════════════════════════════════════
log('hdr', `Generate SDK → ${TOKO_ONLINE}/${TOKO_OUTPUT}`)

run(`node "${CLI}" generate --manifest routesync.manifest.json --output ${TOKO_OUTPUT} --next-actions --zod`, {
  cwd: TOKO_ONLINE,
})

const out = (file) => join(TOKO_ONLINE, TOKO_OUTPUT, file)

check(out('api.ts'),       'api.ts — typed API client',         'defineApi')
check(out('api.ts'),       'api.ts — API_ENDPOINTS constants',  'API_ENDPOINTS')
check(out('hooks.ts'),     'hooks.ts — defineHooks registry',   'defineHooks')
check(out('actions.ts'),   'actions.ts — Next.js Server Actions', 'Action')
check(out('index.ts'),     'index.ts — barrel export',           'export')
check(out('query-key.ts'), 'query-key.ts — QueryKey factory',    'QueryKey')

// Dynamic files — may or may not exist based on manifest content
if (existsSync(out('core/models.ts'))) {
  log('ok', 'core/models.ts — Eloquent DB types')
}
if (existsSync(out('contract/api-contract.ts'))) {
  log('ok', 'contract/api-contract.ts — Zod validators')
}
if (existsSync(out('mappers/api-mapper.ts'))) {
  log('ok', 'mappers/api-mapper.ts — camelCase response mappers')
}

// Verify the generated SDK references real toko-online endpoints
const apiContent = readFileSync(out('api.ts'), 'utf8')
const expectedRoutes = ['produk', 'login', 'register', 'cart', 'orders', 'wishlist', 'checkout']
for (const r of expectedRoutes) {
  if (apiContent.includes(r)) {
    log('ok', `api.ts has "${r}" endpoint`)
  } else {
    log('fail', `api.ts missing "${r}" endpoint`)
  }
}
console.log('')

// ═══════════════════════════════════════════════════════════════════════════
// 5. CLI — help and version
// ═══════════════════════════════════════════════════════════════════════════
log('hdr', 'CLI: help and version')
const helpOut = run(`node "${CLI}" --help`, { cwd: repoRoot, quiet: true, ignoreError: true })
if (helpOut.includes('generate') && helpOut.includes('scan')) {
  log('ok', 'routesync --help')
} else {
  log('fail', 'routesync --help output incomplete')
}

const verOut = run(`node "${CLI}" --version`, { cwd: repoRoot, quiet: true, ignoreError: true })
if (verOut.trim()) {
  log('ok', `routesync --version → ${verOut.trim()}`)
} else {
  log('fail', 'routesync --version')
}
console.log('')

// ═══════════════════════════════════════════════════════════════════════════
// 6. Library direct invocation — SDK imports work stand-alone
// ═══════════════════════════════════════════════════════════════════════════
log('hdr', 'Library: SDK direct invocation')
const require = createRequire(join(repoRoot, 'package.json'))
try {
  const sdk = require(join(repoRoot, 'dist', 'sdk.js'))
  const requiredExports = ['defineApi', 'endpoint', 'resource', 'createService',
    'snakeToCamelKey', 'camelToSnakeKey', 'mapKeysDeep', 'toCamelCase', 'toSnakeCase']
  for (const exp of requiredExports) {
    if (typeof sdk[exp] === 'function') {
      log('ok', `sdk.${exp}() available`)
    } else {
      log('fail', `sdk.${exp}() missing or not a function`)
    }
  }

  // Exercise defineApi + endpoint + toCamelCase
  const api = sdk.defineApi({
    produk: {
      list: sdk.endpoint({ method: 'GET', path: '/produk' }),
      show: sdk.endpoint({ method: 'GET', path: '/produk/{id}' }),
    },
  })
  if (api && api.produk && typeof api.produk.list === 'function') {
    log('ok', 'defineApi + endpoint → callable instance')
  } else {
    log('fail', 'defineApi + endpoint returned unexpected shape')
  }

  const cameled = sdk.toCamelCase({ user_name: 'test', first_name: 'john' })
  if (cameled.userName === 'test' && cameled.firstName === 'john') {
    log('ok', 'toCamelCase mapping works')
  } else {
    log('fail', `toCamelCase mapping incorrect: ${JSON.stringify(cameled)}`)
  }

  const snaked = sdk.toSnakeCase({ userName: 'test', firstName: 'john' })
  if (snaked.user_name === 'test' && snaked.first_name === 'john') {
    log('ok', 'toSnakeCase mapping works')
  } else {
    log('fail', `toSnakeCase mapping incorrect: ${JSON.stringify(snaked)}`)
  }
} catch (e) {
  log('fail', `SDK import failed: ${e.message}`)
}

// ═══════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════
console.log('')
if (failures === 0) {
  log('ok', 'All checks passed.')
  process.exit(0)
} else {
  log('fail', `${failures} check(s) failed.`)
  process.exit(1)
}
