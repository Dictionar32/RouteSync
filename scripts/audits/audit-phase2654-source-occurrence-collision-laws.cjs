const fs = require('node:fs')
const path = require('node:path')

const root = process.cwd()
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const verifier = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts')
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts')
const checks = [
  ['collision-key law is part of the guarded verifier law inventory', /'duplicate_occurrences_match_collision_key'/.test(verifier)],
  ['collision-key verification derives witnesses from the canonical input inventory', /duplicateIdentityWitnesses\(preparation\.input\)/.test(verifier)],
  ['collision-key verification compares proof occurrence references with canonical collision identity', /mismatchedOccurrences = actual\.filter\(item => item\.semanticKey !== witness\.semanticKey\)/.test(verifier) && /occurrenceCoverageMatches/.test(verifier)],
  ['duplicate-location law rejects colliding declarations that reuse source coordinates', /duplicateSourceLocationViolation/.test(verifier) && /sameLocation\(first\.location, second\.location\)/.test(verifier)],
  ['source-location failures use the typed canonical counterexample for the corresponding law', /law: 'duplicate_occurrences_are_distinct_source_locations'/.test(verifier) && /law: 'duplicate_occurrences_match_collision_key'/.test(verifier)],
  ['failure evidence remains domain-correlated in the upstream contract', /RequestTypeDuplicateOccurrenceLocationFailureEvidence/.test(contract) && /RequestTypeDuplicateIdentityWitness/.test(contract)],
  ['guard delegates only after source-occurrence checks pass and preserves the delegate envelope', /if \(failure !== undefined\)[\s\S]*?return delegate\.verify\(inference\);/.test(verifier) && /would silently hide a[\s\S]*?different contract or inference packet/.test(verifier)],
  ['the change introduces no semantic foundation/relation dependency', !/semantic\/(foundation|relations)/.test(verifier)],
]
let failed = 0
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`)
  if (!passed) failed += 1
}
process.stdout.write(`Phase 2654 audit: ${checks.length - failed}/${checks.length} passed\n`)
process.exitCode = failed === 0 ? 0 : 1
