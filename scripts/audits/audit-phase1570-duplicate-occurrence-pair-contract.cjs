const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts'), 'utf8');
const checks = [
  ['duplicate pair has an explicit first occurrence', contract.includes('readonly first: T')],
  ['duplicate pair has an explicit second occurrence', contract.includes('readonly second: T')],
  ['additional collisions are represented without losing the primary pair', contract.includes('readonly additional: readonly T[]')],
  ['pair occurrences are constrained to source evidence with occurrence keys', contract.includes('T extends Readonly<{ readonly occurrenceKey: RequestTypeSourceOccurrenceKey }>')],
  ['distinct-location law remains explicit', contract.includes("'duplicate_occurrences_are_distinct_source_locations'")],
  ['reused-location counterexample identifies the repeated occurrence key', contract.includes("readonly reason: 'duplicate_occurrence_location_reused'") && contract.includes('readonly repeatedOccurrenceKey: RequestTypeSourceOccurrenceKey')],
  ['collision-key law remains explicit', contract.includes("'duplicate_occurrences_match_collision_key'")],
  ['duplicate witness remains domain-specific', contract.includes('RequestTypeDuplicateOccurrencePair<RequestTypeRouteEvidenceReference>') && contract.includes('RequestTypeDuplicateOccurrencePair<RequestTypeResourceEvidenceReference>') && contract.includes('RequestTypeDuplicateOccurrencePair<RequestTypeRequestEvidenceReference>')],
  ['interface contains no runtime implementation', !contract.includes('export const ') && !contract.includes('Object.freeze')],
];
const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
const report = { phase: 1570, audit: 'duplicate-occurrence-pair-contract', passed: checks.length - failures.length, total: checks.length, checks: checks.map(([name, passed]) => ({ name, passed })), failures, scope: 'static interface audit only; no authority/scanner/runtime migration or full build claim' };
fs.writeFileSync(path.join(root, 'PHASE1570_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
