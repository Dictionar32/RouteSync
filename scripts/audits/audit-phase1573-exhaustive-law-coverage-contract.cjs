const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts'), 'utf8');
const lawRegistry = source.match(/export const REQUEST_TYPE_DERIVATION_LAW_IDS\s*=\s*\[([\s\S]*?)\] as const;/);
const lawIds = lawRegistry ? [...lawRegistry[1].matchAll(/'([^']+)'/g)].map(match => match[1]) : [];
const checks = [
  ['canonical law registry is present and non-empty', lawIds.length > 0],
  ['law identifiers are unique', new Set(lawIds).size === lawIds.length],
  ['required coverage is a mapped record over the complete law union', /RequestTypeDerivationRequiredLawCoverage\s*=\s*Readonly<\s*Record<RequestTypeDerivationLawId, 'required'>\s*>/.test(source)],
  ['verified coverage is a mapped record over the complete law union', /RequestTypeDerivationVerifiedLawCoverage\s*=\s*Readonly<\s*Record<RequestTypeDerivationLawId, 'verified'>\s*>/.test(source)],
  ['derivation proof requires verified exhaustive law coverage', /export interface RequestTypeDerivationProof[\s\S]*?readonly laws: RequestTypeDerivationVerifiedLawCoverage;/.test(source)],
  ['contract requires every declared law instead of a partial array', /export interface RequestTypeDerivationContract[\s\S]*?readonly laws: RequestTypeDerivationRequiredLawCoverage;/.test(source)],
  ['successful verification exposes exhaustive verified law coverage', /kind: 'valid';[\s\S]*?verifiedLaws: RequestTypeDerivationVerifiedLawCoverage;/.test(source)],
  ['failed verification remains law-specific and carries typed evidence', /export type RequestTypeDerivationVerificationFailure\s*=([\s\S]*?)export type RequestTypeDerivationVerification\s*=/.test(source) && /readonly law: '[^']+'/.test(source)],
  ['authority derive returns a judgment paired with its verification outcome', /readonly derive: \(input: RequestTypeDerivationInput\) => RequestTypeDerivationAuthorityOutcome;/.test(source)],
  ['interface file remains declarative without an embedded authority executor', source.includes('export const REQUEST_TYPE_DERIVATION_LAW_IDS') && !source.includes('export const createRequestTypeDerivationAuthority') && !source.includes('Object.freeze(')],
  ['previous domain-correlated duplicate evidence remains intact', source.includes('RequestTypeDuplicateOccurrenceLocationFailureEvidence') && source.includes('RequestTypePairwiseDuplicateOccurrenceLocationFailureEvidence')],
  ['successful verification cannot claim only a subset through a law-id array', !/kind: 'valid'[\s\S]*?verifiedLaws: readonly RequestTypeDerivationLawId\[\]/.test(source)],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
const report = {
  phase: 1573,
  audit: 'exhaustive-law-coverage-contract',
  lawCount: lawIds.length,
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  failures,
  scope: 'static structural audit of exhaustive interface law coverage; does not claim that an authority implementation currently verifies these laws or that the full repository builds',
};
fs.writeFileSync(path.join(root, 'PHASE1573_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
