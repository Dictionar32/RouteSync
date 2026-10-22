const fs = require('node:fs')
const path = require('node:path')

const root = process.cwd()
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const operation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRequestResolutionInventory.ts')
const inventory = read('packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts')
const checks = [
  ['resolution inventory joins route evidence by canonical source-occurrence identity', /canonicalRouteOccurrenceKey\(route\.provenance\)/.test(operation) && /candidate\.occurrenceKey === occurrenceKey/.test(operation)],
  ['resolution inventory no longer depends on route/evidence array positions', !/inventory\.routes\.slice\(index, index \+ 1\)/.test(operation) && !/routes\.flatMap\(\(route, index/.test(operation)],
  ['missing or duplicate occurrence receipts fail closed', /evidence\.length !== 1 \|\| routeEvidence === undefined/.test(operation) && /must contain exactly one route evidence receipt/.test(operation)],
  ['canonical occurrence identity remains owned by upstream inventory', /canonicalRouteOccurrenceKey/.test(inventory) && /sourceSpanIdentity/.test(inventory)],
  ['resolution inventory keeps explicit closed request-binding cases', /case 'form_request'/.test(operation) && /case 'unresolved_request'/.test(operation) && /case 'unresolved_action_request'/.test(operation)],
  ['operation avoids semantic foundation and relation dependencies', !/semantic\/(foundation|relations)/.test(operation)],
]
let failed = 0
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`)
  if (!passed) failed += 1
}
process.stdout.write(`Phase 2544 audit: ${checks.length - failed}/${checks.length} passed\n`)
process.exitCode = failed === 0 ? 0 : 1
