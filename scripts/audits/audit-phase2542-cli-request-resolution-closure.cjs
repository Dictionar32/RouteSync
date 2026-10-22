const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../..')
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8')
const checks = []
const assert = (name, condition) => {
  checks.push({ name, passed: Boolean(condition) })
}

const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts')
const operation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRequestResolutionAssessment.ts')
const coreIndex = read('packages/core/src/index.ts')
const scan = read('packages/cli/src/commands/scan.ts')
const sync = read('packages/cli/src/commands/sync.ts')

assert('upstream closed assessment ADT exists', /export type RequestTypeRequestResolutionAssessment\s*=/.test(contract) && /kind: 'incomplete_and_conflicted'/.test(contract))
assert('assessment interface owns operation contract', /export interface RequestTypeRequestResolutionAssessmentInterface/.test(contract) && /readonly assess:/.test(contract))
assert('missing resolution is retained as incomplete', /kind: 'incomplete'/.test(operation) && /resolution\.kind === 'missing'/.test(operation))
assert('unresolved request bindings are not mislabeled not-required', /kind: 'unresolved_binding'/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRequestResolutionInventory.ts')) && /unresolvedBindingReceipts/.test(operation))
assert('ambiguous resolution is retained as conflict', /kind: 'conflict'/.test(operation) && /ambiguous_exact/.test(operation) && /ambiguous_normalized/.test(operation))
assert('mixed missing and ambiguity has distinct ADT', /kind: 'incomplete_and_conflicted'/.test(operation))
assert('assessment does not fabricate semantic judgment or proof', /does not derive RequestType values and does not claim proof-law verification/.test(operation) && !/RequestTypeDerivationJudgment/.test(operation))
assert('new operation has no semantic foundation or relations dependency', !/semantic\/foundation|semantic\/relations/.test(operation))
assert('operation exported through core package boundary', /requestTypeDerivationRequestResolutionAssessment/.test(coreIndex))
assert('CLI scan persists preflight assessment before invoking projection', /routesync\.request-type-resolution\.json/.test(scan) && /routeManifestRequestResolutionPreflight\.evaluate/.test(scan) && scan.indexOf('routeManifestRequestResolutionPreflight.evaluate(completeManifest)') < scan.indexOf('projectRouteSyncManifestForRouteManifest(\n        requestResolutionPreflight') && /case 'incomplete_and_conflicted'/.test(scan))
assert('CLI sync persists preflight assessment before invoking projection', /routesync\.request-type-resolution\.json/.test(sync) && /routeManifestRequestResolutionPreflight\.evaluate/.test(sync) && sync.indexOf('routeManifestRequestResolutionPreflight.evaluate(completeManifest)') < sync.indexOf('projectRouteSyncManifestForRouteManifest(\n        requestResolutionPreflight') && /case 'incomplete_and_conflicted'/.test(sync))
assert('both CLI paths only continue through resolved variant', /case 'resolved':[\s\S]*?break[\s\S]*?case 'incomplete'/.test(scan) && /case 'resolved':[\s\S]*?break[\s\S]*?case 'incomplete'/.test(sync))

for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`)
console.log(`${checks.filter(check => check.passed).length}/${checks.length} assertions passed`)
if (checks.some(check => !check.passed)) process.exitCode = 1
