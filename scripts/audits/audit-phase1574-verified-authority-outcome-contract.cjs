const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts'), 'utf8');
const checks = [
  ['authority outcome is a named public contract', /export type RequestTypeDerivationAuthorityOutcome\s*=/.test(source)],
  ['verified outcome couples a non-rejected judgment with valid verification', /kind: 'verified';[\s\S]*?judgment: Exclude<RequestTypeDerivationJudgment, \{ readonly kind: 'invalid_input' \}>;[\s\S]*?verification: Extract<RequestTypeDerivationVerification, \{ readonly kind: 'valid' \}>;/.test(source)],
  ['input rejection couples invalid-input judgment with confirmed rejection', /kind: 'input_rejected';[\s\S]*?judgment: Extract<RequestTypeDerivationJudgment, \{ readonly kind: 'invalid_input' \}>;[\s\S]*?verification: Extract<RequestTypeDerivationVerification, \{ readonly kind: 'rejection_confirmed' \}>;/.test(source)],
  ['verification failure cannot be mistaken for a verified judgment', /kind: 'verification_failed';[\s\S]*?judgment: Exclude<RequestTypeDerivationJudgment, \{ readonly kind: 'invalid_input' \}>;[\s\S]*?verification: RequestTypeDerivationVerificationFailure;/.test(source)],
  ['public derive no longer returns a bare judgment', /readonly derive: \(input: RequestTypeDerivationInput\) => RequestTypeDerivationAuthorityOutcome;/.test(source) && !/readonly derive: \(input: RequestTypeDerivationInput\) => RequestTypeDerivationJudgment;/.test(source)],
  ['independent verify operation remains available', /readonly verify: \(input: RequestTypeDerivationInput, judgment: RequestTypeDerivationJudgment\) => RequestTypeDerivationVerification;/.test(source)],
  ['exhaustive law coverage remains part of contract', /readonly laws: RequestTypeDerivationRequiredLawCoverage;/.test(source) && /readonly laws: RequestTypeDerivationVerifiedLawCoverage;/.test(source)],
  ['verified law coverage remains explicit on successful verification', /kind: 'valid';[\s\S]*?verifiedLaws: RequestTypeDerivationVerifiedLawCoverage;/.test(source)],
  ['typed duplicate location evidence remains domain-correlated', source.includes('RequestTypeDuplicateOccurrenceLocationFailureEvidence') && source.includes('RequestTypePairwiseDuplicateOccurrenceLocationFailureEvidence')],
  ['interface remains declarative without executable authority implementation', source.includes('export const REQUEST_TYPE_DERIVATION_LAW_IDS') && !source.includes('export const createRequestTypeDerivationAuthority') && !source.includes('Object.freeze(')],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
const report = {
  phase: 1574,
  audit: 'verified-authority-outcome-contract',
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  failures,
  scope: 'static structural audit only; it checks that the interface cannot return a bare judgment, not that an implementation currently verifies semantic laws',
};
fs.writeFileSync(path.join(root, 'PHASE1574_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
