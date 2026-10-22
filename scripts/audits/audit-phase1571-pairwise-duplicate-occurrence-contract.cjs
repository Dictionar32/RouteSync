const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts'), 'utf8');
const checks = [
  ['pairwise occurrence law is part of the semantic law vocabulary', contract.includes("'all_duplicate_occurrence_locations_are_pairwise_distinct'")],
  ['pairwise reuse has a dedicated counterexample reason', contract.includes("readonly reason: 'duplicate_occurrence_pairwise_location_reused'")],
  ['counterexample records a non-empty set of repeated pairs', contract.includes('readonly repeatedPairs: RequestTypeNonEmptyLedger<Readonly<{')],
  ['each repeated pair names both source evidence references', contract.includes('readonly first: RequestTypeRouteEvidenceReference;') && contract.includes('readonly second: RequestTypeRouteEvidenceReference;') && contract.includes('readonly first: RequestTypeResourceEvidenceReference;') && contract.includes('readonly second: RequestTypeResourceEvidenceReference;') && contract.includes('readonly first: RequestTypeRequestEvidenceReference;') && contract.includes('readonly second: RequestTypeRequestEvidenceReference;')],
  ['each repeated pair identifies the repeated occurrence key', contract.includes('readonly repeatedOccurrenceKey: RequestTypeRouteOccurrenceKey;') && contract.includes('readonly repeatedOccurrenceKey: RequestTypeResourceOccurrenceKey;') && contract.includes('readonly repeatedOccurrenceKey: RequestTypeRequestOccurrenceKey;')],
  ['counterexample retains collision domain and semantic key', contract.includes("readonly domain: 'routes';") && contract.includes("readonly domain: 'resources';") && contract.includes("readonly domain: 'requests';") && contract.includes('readonly semanticKey: RequestTypeRouteEvidenceKey;') && contract.includes('readonly semanticKey: RequestTypeResourceEvidenceKey;') && contract.includes('readonly semanticKey: RequestTypeRequestEvidenceKey;')],
  ['primary duplicate-pair contract remains explicit', contract.includes('readonly first: T') && contract.includes('readonly second: T') && contract.includes('readonly additional: readonly T[]')],
  ['distinct-location and collision-key laws remain explicit', contract.includes("'duplicate_occurrences_are_distinct_source_locations'") && contract.includes("'duplicate_occurrences_match_collision_key'")],
  ['source-location provenance law remains explicit', contract.includes("'source_occurrence_location_matches_evidence'") && contract.includes("'source_occurrence_key_matches_source_coordinates'")],
  ['interface contains no runtime implementation', contract.includes('export const REQUEST_TYPE_DERIVATION_LAW_IDS') && !contract.includes('export const createRequestTypeDerivationAuthority') && !contract.includes('Object.freeze')],
];
const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
const report = { phase: 1571, audit: 'pairwise-duplicate-occurrence-contract', passed: checks.length - failures.length, total: checks.length, checks: checks.map(([name, passed]) => ({ name, passed })), failures, scope: 'static interface audit only; semantic authority, scanner wiring, runtime executor and full build are not claimed as migrated' };
fs.writeFileSync(path.join(root, 'PHASE1571_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
