const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const upstream = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const coverage = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationCoverage.ts');
const authority = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts');
const checks = [
  ['coverage operation contract is owned upstream', /interface RequestTypeDerivationAuthorityCoverageInterface/.test(upstream)],
  ['coverage operation accepts the existing verification ADT', /assess:[\s\S]*verification: RequestTypeDerivationVerification/.test(upstream)],
  ['coverage operation returns existing closed coverage ADT', /RequestTypeAuthorityCoverageEvidenceFor<TContract>/.test(upstream)],
  ['coverage producer reuses canonical law identifiers', /REQUEST_TYPE_DERIVATION_LAW_IDS/.test(coverage)],
  ['missing contract laws produce contract_incomplete', /kind: 'contract_incomplete'/.test(coverage)],
  ['missing verified laws produce verification_incomplete', /kind: 'verification_incomplete'/.test(coverage)],
  ['complete coverage preserves the original contract', /kind: 'complete', contract/.test(coverage)],
  ['coverage producer does not derive or repair judgments', !/deriveJudgment|aggregateRequestTypeGroups|createDerivationContext/.test(coverage)],
  ['legacy authority delegates coverage checks to the operation', /coverage\.assess\(verification\)/.test(authority)],
  ['legacy authority no longer duplicates law-coverage checks', !/hasCompleteLawCoverage/.test(authority)],
  ['coverage failures remain explicit authority_inconsistent outcomes', /reason: 'contract_law_coverage_incomplete'/.test(authority) && /reason: 'verified_law_coverage_incomplete'/.test(authority)],
  ['new coverage operation avoids relation/foundation imports', !/semantic\/relations|semantic\/foundation/.test(coverage)],
];
let failures = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
  if (!passed) failures += 1;
}
console.log(`\n${checks.length - failures}/${checks.length} assertions passed`);
if (failures > 0) process.exitCode = 1;
