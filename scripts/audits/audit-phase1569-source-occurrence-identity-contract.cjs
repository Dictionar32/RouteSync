const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const barrel = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/index.ts'), 'utf8');
const checks = [
  ['interface remains declaration-only', !contract.includes('export const ') && !contract.includes('Object.freeze')],
  ['semantic identity and source occurrence identity are separate concepts', contract.includes('RequestTypeEvidenceKey') && contract.includes('RequestTypeSourceOccurrenceKey')],
  ['occurrence keys are domain-tagged', contract.includes('`route-occurrence:${string}`') && contract.includes('`resource-occurrence:${string}`') && contract.includes('`request-occurrence:${string}`')],
  ['route evidence reference carries source occurrence identity', contract.includes("readonly occurrenceKey: RequestTypeRouteOccurrenceKey")],
  ['resource evidence reference carries source occurrence identity', contract.includes("readonly occurrenceKey: RequestTypeResourceOccurrenceKey")],
  ['request evidence reference carries source occurrence identity', contract.includes("readonly occurrenceKey: RequestTypeRequestOccurrenceKey")],
  ['occurrence identity is documented as source-coordinate based', contract.includes('must be stable from source coordinates') && contract.includes('must not be minted from traversal order') && contract.includes('object identity')],
  ['duplicate witness still carries a collision semantic key', contract.includes('readonly semanticKey: RequestTypeRouteEvidenceKey') && contract.includes('readonly semanticKey: RequestTypeResourceEvidenceKey') && contract.includes('readonly semanticKey: RequestTypeRequestEvidenceKey')],
  ['duplicate witness names first and second occurrences plus additional collisions', contract.includes('readonly first: T') && contract.includes('readonly second: T') && contract.includes('readonly additional: readonly T[]')],
  ['duplicate witness requires domain-specific occurrence refs', contract.includes('RequestTypeDuplicateOccurrencePair<RequestTypeRouteEvidenceReference>') && contract.includes('RequestTypeDuplicateOccurrencePair<RequestTypeResourceEvidenceReference>') && contract.includes('RequestTypeDuplicateOccurrencePair<RequestTypeRequestEvidenceReference>')],
  ['duplicate collision-key law remains explicit', contract.includes("'duplicate_occurrences_match_collision_key'")],
  ['distinct-source-location law is explicit', contract.includes("'duplicate_occurrences_are_distinct_source_locations'")],
  ['occurrence key is checked against source coordinates', contract.includes("'source_occurrence_key_matches_source_coordinates'") && contract.includes('RequestTypeSourceOccurrenceKeyMismatch')],
  ['source-occurrence mismatch is a typed counterexample', contract.includes("readonly reason: 'source_occurrence_key_mismatch'") && contract.includes('RequestTypeNonEmptyLedger<RequestTypeSourceOccurrenceKeyMismatch>')],
  ['reused occurrence location has typed counterexample', contract.includes("readonly reason: 'duplicate_occurrence_location_reused'") && contract.includes('readonly repeatedOccurrenceKey: RequestTypeSourceOccurrenceKey')],
  ['collision-key mismatch still has typed counterexample', contract.includes("readonly reason: 'duplicate_occurrence_key_mismatch'") && contract.includes('readonly mismatchedOccurrences: readonly RequestTypeEvidenceReference[]')],
  ['duplicate input rejection requires non-empty witness ledger', (contract.match(/readonly duplicateIdentities: RequestTypeNonEmptyLedger/g) || []).length === 3],
  ['input rejection preserves route/resource/request domain distinctions', (contract.match(/readonly domain: '(routes|resources|requests)';/g) || []).length >= 6],
  ['rejection confirmation remains distinct from successful derivation', contract.includes("readonly kind: 'rejection_confirmed' }> & RequestTypeDerivationInputRejection")],
  ['verification failures bind law and evidence', (contract.match(/readonly kind: 'invalid';/g) || []).length === (contract.match(/readonly law: /g) || []).length],
  ['upstream barrel exports the interface', barrel.includes("export * from './requestTypeDerivationInterface'")],
  ['scanner and runtime implementation remain outside the interface', !contract.includes('RequestTypeDeriver') && !contract.includes('semanticTypeDerivationRuntimeExecutor')],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
const report = {
  phase: 1569,
  audit: 'source-occurrence-identity-and-duplicate-distinctness-contract',
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  failures,
  scope: 'static interface-model audit only; does not claim authority implementation, scanner migration, runtime migration, full TypeScript build, package build, or Vitest validation',
  findings: [
    'semantic collision identity is distinct from source occurrence identity',
    'each route/resource/request evidence reference carries a domain-tagged source occurrence key',
    'duplicate evidence requires multiple occurrences and authority must prove they are distinct source locations',
    'the verifier has a typed counterexample for reused occurrence locations',
    'scanner and runtime implementations intentionally unchanged',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE1569_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
