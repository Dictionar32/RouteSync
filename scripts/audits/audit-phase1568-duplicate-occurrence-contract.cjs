const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const barrel = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/index.ts'), 'utf8');
const checks = [
  ['interface remains declaration-only', !contract.includes('export const ') && !contract.includes('Object.freeze')],
  ['duplicate witness names semantic collision key', contract.includes('readonly semanticKey: RequestTypeRouteEvidenceKey') && contract.includes('readonly semanticKey: RequestTypeResourceEvidenceKey') && contract.includes('readonly semanticKey: RequestTypeRequestEvidenceKey')],
  ['duplicate witness carries actual route occurrences', contract.includes("readonly domain: 'routes';\n      readonly semanticKey: RequestTypeRouteEvidenceKey;\n      readonly occurrences: RequestTypeDuplicateOccurrencePair<RequestTypeRouteEvidenceReference>")],
  ['duplicate witness carries actual resource occurrences', contract.includes("readonly domain: 'resources';\n      readonly semanticKey: RequestTypeResourceEvidenceKey;\n      readonly occurrences: RequestTypeDuplicateOccurrencePair<RequestTypeResourceEvidenceReference>")],
  ['duplicate witness carries actual request occurrences', contract.includes("readonly domain: 'requests';\n      readonly semanticKey: RequestTypeRequestEvidenceKey;\n      readonly occurrences: RequestTypeDuplicateOccurrencePair<RequestTypeRequestEvidenceReference>")],
  ['duplicate occurrences require at least two source records', contract.includes('readonly [T, T, ...T[]]')],
  ['duplicate input rejection requires non-empty witness ledger', (contract.match(/readonly duplicateIdentities: RequestTypeNonEmptyLedger/g) || []).length === 3],
  ['duplicate input evidence no longer uses key-only duplicate ledger', !contract.includes('duplicateKeys: RequestTypeNonEmptyLedger')],
  ['duplicate witness law is part of semantic law vocabulary', contract.includes("'duplicate_occurrences_match_collision_key'")],
  ['duplicate mismatch has typed counterexample', contract.includes("readonly reason: 'duplicate_occurrence_key_mismatch'") && contract.includes('readonly mismatchedOccurrences: readonly RequestTypeEvidenceReference[]')],
  ['input rejection still distinguishes route/resource/request domains', (contract.match(/readonly domain: '(routes|resources|requests)';/g) || []).length >= 6],
  ['rejection confirmation remains distinct from successful derivation', contract.includes("readonly kind: 'rejection_confirmed' }> & RequestTypeDerivationInputRejection")],
  ['verification failures bind law and evidence', (contract.match(/readonly kind: 'invalid';/g) || []).length === (contract.match(/readonly law: /g) || []).length],
  ['authority verifier retains input and judgment', contract.includes('verify: (input: RequestTypeDerivationInput, judgment: RequestTypeDerivationJudgment) => RequestTypeDerivationVerification')],
  ['upstream barrel exports the interface', barrel.includes("export * from './requestTypeDerivationInterface'")],
  ['scanner and runtime implementations are not embedded in the interface', !contract.includes('RequestTypeDeriver') && !contract.includes('semanticTypeDerivationRuntimeExecutor')],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
const report = {
  phase: 1568,
  audit: 'typed-duplicate-source-occurrence-contract',
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  failures,
  scope: 'static interface-model audit only; does not claim authority implementation, scanner migration, runtime migration, full TypeScript build, package build, or Vitest validation',
  findings: [
    'a duplicate identity now requires the collision key plus at least two typed source occurrences',
    'occurrence/key equality is an explicit semantic law that authority must verify',
    'route, resource, and request collision witnesses are domain-specific',
    'scanner and runtime files intentionally unchanged',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE1568_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
