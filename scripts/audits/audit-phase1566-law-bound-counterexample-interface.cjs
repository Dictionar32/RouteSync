const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const file = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const contract = fs.readFileSync(file, 'utf8');
const barrel = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/index.ts'), 'utf8');
const invalidCount = (contract.match(/readonly kind: 'invalid';/g) || []).length;
const lawCount = (contract.match(/readonly law: /g) || []).length;
const checks = [
  ['interface remains type/declaration-only', !contract.includes('export const ') && !contract.includes('Object.freeze')],
  ['each invalid counterexample carries a law identifier', invalidCount > 0 && invalidCount === lawCount],
  ['source inventory failures bind to source disposition/closure laws', contract.includes("readonly law: 'every_source_has_a_disposition' | 'judgment_closure_matches_source_ledger'")],
  ['source key mismatch binds to the domain identity law', contract.includes("readonly law: 'evidence_key_matches_source_domain'")],
  ['route disposition failures bind to request-binding laws', contract.includes("readonly law: 'request_binding_kind_matches_route_disposition' | 'framework_request_binding_is_accounted_exclusion' | 'every_source_has_a_disposition'")],
  ['group membership failures bind to contribution reconciliation laws', contract.includes("readonly law: 'group_contributions_are_reconciled' | 'every_group_contribution_has_receipt'")],
  ['output failures bind to output/proof coherence laws', contract.includes("readonly law: 'group_receipt_matches_judgment_output' | 'judgment_payload_matches_proof_ledger'")],
  ['resource failure binds to resolved-resource law', contract.includes("readonly law: 'contributed_route_has_resolved_resource'")],
  ['transition failures bind to transition algebra laws', contract.includes("readonly law: 'contribution_transition_is_contiguous' | 'contribution_transition_matches_policy' | 'group_result_matches_final_transition'")],
  ['group-key failure binds to canonical identity law', contract.includes("readonly law: 'group_key_matches_resource_identity'")],
  ['policy mismatch binds to policy-contract law', contract.includes("readonly law: 'authority_policy_matches_contract'") && contract.includes("| 'authority_policy_matches_contract'")],
  ['closure mismatch binds to closure coherence laws', contract.includes("readonly law: 'judgment_closure_matches_source_ledger' | 'judgment_kind_matches_closure'")],
  ['incomplete ledger binds to unresolved ledger law', contract.includes("readonly law: 'incomplete_judgment_matches_unresolved_ledger'")],
  ['conflict ledger binds to conflict ledger law', contract.includes("readonly law: 'conflict_judgment_matches_conflict_ledger'")],
  ['counterexamples retain typed evidence payloads', invalidCount === (contract.match(/readonly evidence: Readonly</g) || []).length],
  ['authority verifier contract still accepts source input and judgment', contract.includes('verify: (input: RequestTypeDerivationInput, judgment: RequestTypeDerivationJudgment) => RequestTypeDerivationVerification')],
  ['upstream barrel exports the interface', barrel.includes("export * from './requestTypeDerivationInterface'")],
  ['scanner and runtime ownership remain outside this interface file', !contract.includes('RequestTypeDeriver') && !contract.includes('semanticTypeDerivationRuntimeExecutor')],
];
const failures = checks.filter(([, passed]) => !passed).map(([name]) => name);
const report = {
  phase: 1566,
  audit: 'law-bound-request-type-counterexample-interface',
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  failures,
  scope: 'static interface-model audit only; no claim of authority implementation, scanner migration, runtime migration, full TypeScript build, package build, or Vitest validation',
  validationNotes: [
    'each verifier failure variant now names the violated semantic law alongside typed evidence',
    'authority policy mismatch has an explicit law identifier',
    'scanner aggregator, scanner entrypoint, and runtime executor intentionally unchanged',
  ],
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
