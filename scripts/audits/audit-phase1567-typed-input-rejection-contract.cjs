const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const barrel = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/index.ts'), 'utf8');
const invalidCount = (contract.match(/readonly kind: 'invalid';/g) || []).length;
const lawCount = (contract.match(/readonly law: /g) || []).length;
const checks = [
  ['interface remains declaration-only', !contract.includes('export const ') && !contract.includes('Object.freeze')],
  ['invalid-input judgment carries typed evidence', contract.includes("readonly kind: 'invalid_input' }> & RequestTypeDerivationInputRejection")],
  ['duplicate route identity uses route-domain keys', contract.includes("readonly domain: 'routes';\n      readonly duplicateKeys: RequestTypeNonEmptyLedger<RequestTypeRouteEvidenceKey>")],
  ['duplicate resource identity uses resource-domain keys', contract.includes("readonly domain: 'resources';\n      readonly duplicateKeys: RequestTypeNonEmptyLedger<RequestTypeResourceEvidenceKey>")],
  ['duplicate request identity uses request-domain keys', contract.includes("readonly domain: 'requests';\n      readonly duplicateKeys: RequestTypeNonEmptyLedger<RequestTypeRequestEvidenceKey>")],
  ['invalid contract rejection carries failed law', contract.includes("readonly reason: 'invalid_contract';\n      readonly evidence: Extract<RequestTypeDerivationInvalidInputEvidence, { readonly reason: 'invalid_contract' }>")],
  ['unsupported policy rejection names supported policy', contract.includes("readonly supportedPolicy: 'exact_then_normalized_unique'")],
  ['reason and evidence are correlated as a discriminated union', contract.includes('export type RequestTypeDerivationInputRejection =') && contract.includes("readonly reason: 'unsupported_policy';")],
  ['proof-less failure excludes invalid-input judgment', contract.includes("Exclude<RequestTypeDerivationJudgment['kind'], 'invalid_input'>")],
  ['rejection confirmation is distinct from successful derivation', contract.includes("readonly kind: 'rejection_confirmed' }> & RequestTypeDerivationInputRejection")],
  ['rejection mismatch has a typed law-bound counterexample', contract.includes("readonly law: 'input_rejection_matches_source_evidence'") && contract.includes("readonly reason: 'input_rejection_evidence_mismatch'")],
  ['all invalid verifier failures bind one law each', invalidCount === lawCount],
  ['all invalid verifier failures carry typed evidence', invalidCount === (contract.match(/readonly evidence: Readonly</g) || []).length],
  ['authority verifier preserves input plus judgment contract', contract.includes('verify: (input: RequestTypeDerivationInput, judgment: RequestTypeDerivationJudgment) => RequestTypeDerivationVerification')],
  ['upstream barrel exports the interface', barrel.includes("export * from './requestTypeDerivationInterface'")],
  ['scanner/runtime implementations remain outside the interface', !contract.includes('RequestTypeDeriver') && !contract.includes('semanticTypeDerivationRuntimeExecutor')],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
const report = {
  phase: 1567,
  audit: 'typed-request-type-input-rejection-contract',
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  failures,
  scope: 'static interface-model audit only; does not claim authority implementation, scanner migration, runtime migration, full TypeScript build, package build, or Vitest validation',
  notes: [
    'invalid input is a first-class typed rejection rather than a proof-less judgment with only a reason string',
    'duplicate source identity witnesses are domain-specific and non-empty',
    'verification distinguishes confirmed rejection from verified successful derivation',
    'scanner and runtime files intentionally unchanged',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE1567_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
