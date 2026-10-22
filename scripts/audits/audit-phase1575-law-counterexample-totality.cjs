const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts'), 'utf8');
const lawBlock = source.match(/export const REQUEST_TYPE_DERIVATION_LAW_IDS\s*=\s*\[([\s\S]*?)\] as const;/)?.[1] ?? '';
const failureBlock = source.split('export type RequestTypeDerivationVerificationFailure =')[1]?.split('export type RequestTypeDerivationVerification =')[0] ?? '';
const lawIds = [...new Set([...lawBlock.matchAll(/'([a-z][a-z0-9_]+)'/g)].map(match => match[1]))];
const missingFailureLaws = lawIds.filter(law => !failureBlock.includes(`'${law}'`));
const failureBranches = [...failureBlock.matchAll(/readonly kind: 'invalid';([\s\S]*?)(?=\n  \| Readonly<|$)/g)].map(match => match[1]);
const branchesMissingReason = failureBranches.filter(branch => !/readonly reason:/.test(branch));
const branchesMissingEvidence = failureBranches.filter(branch => !/readonly evidence:/.test(branch));
const requiredNewLaws = [
  'route_has_explicit_request_binding',
  'request_identity_exact_match',
  'request_identity_normalized_unique_match',
  'ambiguous_identity_is_conflict',
  'resource_identity_is_canonical',
  'route_contributes_action',
  'route_contributes_response',
  'invalid_input_requires_typed_counterexample',
];
const checks = [
  ['all declared law identifiers are discoverable', lawIds.length === 33],
  ['every declared law has a typed verifier-failure counterexample', missingFailureLaws.length === 0],
  ['all eight previously uncovered laws have explicit failure branches', requiredNewLaws.every(law => failureBlock.includes(`readonly law: '${law}'`))],
  ['every invalid failure branch carries a reason', branchesMissingReason.length === 0],
  ['every invalid failure branch carries typed evidence', branchesMissingEvidence.length === 0],
  ['authority outcome remains coupled to verification', /readonly derive: \(input: RequestTypeDerivationInput\) => RequestTypeDerivationAuthorityOutcome;/.test(source)],
  ['verified outcome still requires exhaustive law coverage', /readonly verifiedLaws: RequestTypeDerivationVerifiedLawCoverage;/.test(source)],
  ['domain-correlated duplicate counterexamples remain present', source.includes('RequestTypeDuplicateOccurrenceLocationFailureEvidence') && source.includes('RequestTypePairwiseDuplicateOccurrenceLocationFailureEvidence')],
  ['contract law coverage remains total over the law union', /readonly laws: RequestTypeDerivationRequiredLawCoverage;/.test(source)],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
const report = {
  phase: 1575,
  audit: 'law-counterexample-totality',
  declaredLawCount: lawIds.length,
  missingFailureLaws,
  failureBranchCount: failureBranches.length,
  branchesMissingReason: branchesMissingReason.length,
  branchesMissingEvidence: branchesMissingEvidence.length,
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  failures,
  scope: 'static structural audit: proves every declared law has a typed failure-union branch, not that an authority implementation actually detects every violation',
};
fs.writeFileSync(path.join(root, 'PHASE1575_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
