const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts'), 'utf8');
const checks = [
  ['location-reuse failure delegates to a named domain-correlated evidence union', /law: 'duplicate_occurrences_are_distinct_source_locations'[\s\S]*?evidence: RequestTypeDuplicateOccurrenceLocationFailureEvidence/.test(contract)],
  ['pairwise location-reuse failure delegates to a named domain-correlated evidence union', /law: 'all_duplicate_occurrence_locations_are_pairwise_distinct'[\s\S]*?evidence: RequestTypePairwiseDuplicateOccurrenceLocationFailureEvidence/.test(contract)],
  ['route location counterexample correlates route key and route references', /domain: 'routes';\s*readonly semanticKey: RequestTypeRouteEvidenceKey;\s*readonly occurrences: RequestTypeDuplicateOccurrencePair<RequestTypeRouteEvidenceReference>;\s*readonly repeatedOccurrenceKey: RequestTypeRouteOccurrenceKey/.test(contract)],
  ['resource location counterexample correlates resource key and resource references', /domain: 'resources';\s*readonly semanticKey: RequestTypeResourceEvidenceKey;\s*readonly occurrences: RequestTypeDuplicateOccurrencePair<RequestTypeResourceEvidenceReference>;\s*readonly repeatedOccurrenceKey: RequestTypeResourceOccurrenceKey/.test(contract)],
  ['request location counterexample correlates request key and request references', /domain: 'requests';\s*readonly semanticKey: RequestTypeRequestEvidenceKey;\s*readonly occurrences: RequestTypeDuplicateOccurrencePair<RequestTypeRequestEvidenceReference>;\s*readonly repeatedOccurrenceKey: RequestTypeRequestOccurrenceKey/.test(contract)],
  ['pairwise route witnesses contain route-only references and occurrence keys', /domain: 'routes';\s*readonly semanticKey: RequestTypeRouteEvidenceKey;\s*readonly repeatedPairs: RequestTypeNonEmptyLedger<Readonly<{\s*readonly first: RequestTypeRouteEvidenceReference;\s*readonly second: RequestTypeRouteEvidenceReference;\s*readonly repeatedOccurrenceKey: RequestTypeRouteOccurrenceKey/.test(contract)],
  ['pairwise resource witnesses contain resource-only references and occurrence keys', /domain: 'resources';\s*readonly semanticKey: RequestTypeResourceEvidenceKey;\s*readonly repeatedPairs: RequestTypeNonEmptyLedger<Readonly<{\s*readonly first: RequestTypeResourceEvidenceReference;\s*readonly second: RequestTypeResourceEvidenceReference;\s*readonly repeatedOccurrenceKey: RequestTypeResourceOccurrenceKey/.test(contract)],
  ['pairwise request witnesses contain request-only references and occurrence keys', /domain: 'requests';\s*readonly semanticKey: RequestTypeRequestEvidenceKey;\s*readonly repeatedPairs: RequestTypeNonEmptyLedger<Readonly<{\s*readonly first: RequestTypeRequestEvidenceReference;\s*readonly second: RequestTypeRequestEvidenceReference;\s*readonly repeatedOccurrenceKey: RequestTypeRequestOccurrenceKey/.test(contract)],
  ['pairwise ledger remains non-empty', /readonly repeatedPairs: RequestTypeNonEmptyLedger</.test(contract)],
  ['the laws remain explicit and separate', contract.includes("'duplicate_occurrences_are_distinct_source_locations'") && contract.includes("'all_duplicate_occurrence_locations_are_pairwise_distinct'") && contract.includes("'duplicate_occurrences_match_collision_key'")],
  ['interface remains declarative and contains no exported runtime executor', contract.includes('export const REQUEST_TYPE_DERIVATION_LAW_IDS') && !contract.includes('export const createRequestTypeDerivationAuthority') && !contract.includes('Object.freeze')],
];
const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  phase: 1572,
  audit: 'domain-correlated-duplicate-counterexample',
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  failures,
  scope: 'static structural audit of interface type correlations; does not claim semantic authority implementation, scanner migration, runtime executor migration, or full build success',
};
fs.writeFileSync(path.join(root, 'PHASE1572_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
