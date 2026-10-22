const fs = require('node:fs')
const path = require('node:path')

const root = process.cwd()
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const checks = []
const assert = (condition, label) => {
  checks.push({ label, passed: Boolean(condition) })
}

const preflightPath = 'packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts'
const preflight = read(preflightPath)
const scan = read('packages/cli/src/commands/scan.ts')
const sync = read('packages/cli/src/commands/sync.ts')
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts')
const index = read('packages/core/src/index.ts')

assert(preflight.includes('RouteManifestRequestResolutionPreflightInterface'), 'preflight is defined by an explicit interface')
assert(preflight.includes('requestTypeDerivationSourceEvidenceInventory.inventory(input)'), 'preflight builds canonical source evidence inventory')
assert(preflight.includes('requestTypeDerivationRequestResolutionInventory.resolve({ ...input, inventory })'), 'preflight uses upstream request-resolution operation')
assert(preflight.includes('requestTypeDerivationRequestResolutionAssessment.assess(ledger)'), 'preflight returns a closed resolution assessment')
assert(!preflight.includes('requestTypeDerivationProjectionPipeline'), 'preflight does not import projection pipeline')
assert(!preflight.includes('requestTypeDerivationSolver'), 'preflight does not import legacy solver')
assert(scan.indexOf('routeManifestRequestResolutionPreflight.evaluate(completeManifest)') < scan.indexOf('projectRouteSyncManifestForRouteManifest(\n        requestResolutionPreflight'), 'scan gates request resolution before projection')
assert(sync.indexOf('routeManifestRequestResolutionPreflight.evaluate(completeManifest)') < sync.indexOf('projectRouteSyncManifestForRouteManifest(\n        requestResolutionPreflight'), 'sync gates request resolution before projection')
assert(scan.includes('switch (requestResolutionPreflight.assessment.kind)'), 'scan exhaustively consumes the closed assessment')
assert(sync.includes('switch (requestResolutionPreflight.assessment.kind)'), 'sync exhaustively consumes the closed assessment')
assert(index.includes("export { routeManifestRequestResolutionPreflight } from './compiler/scanner/wiring/routeManifestRequestResolutionPreflight'"), 'preflight operation is exported from core package')
assert(projection.includes('projection.project(preflight)') && read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts').includes('lowering.project(preflight)') && read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts').includes('operationPreparation.prepare(preflight.input)'), 'projection forwards the exact manifest-bound preflight packet and input into lowering')

for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.label}`)
console.log(`Phase 2543 audit: ${checks.filter(check => check.passed).length}/${checks.length} passed`)
if (checks.some(check => !check.passed)) process.exitCode = 1
