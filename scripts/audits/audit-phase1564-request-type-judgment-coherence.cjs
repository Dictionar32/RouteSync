const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const barrelPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const checks = [
  ['interface remains declaration-only', !/export const |Object\.freeze|=>\s*\{/.test(contract)],
  ['semantic outcomes are discriminated judgments', /kind: 'derived'/.test(contract) && /kind: 'incomplete'/.test(contract) && /kind: 'conflict'/.test(contract)],
  ['proof closure is correlated with judgment kind', /RequestTypeDerivationProofFor<'closed'>/.test(contract) && /RequestTypeDerivationProofFor<'incomplete'>/.test(contract) && /RequestTypeDerivationProofFor<'conflicted'>/.test(contract)],
  ['closed judgment requires closed proof closure', /kind: 'derived'[\s\S]*?RequestTypeDerivationProofFor<'closed'>/.test(contract)],
  ['incomplete judgment requires incomplete proof closure', /kind: 'incomplete'[\s\S]*?RequestTypeDerivationProofFor<'incomplete'>/.test(contract)],
  ['conflict judgment requires conflicted proof closure', /kind: 'conflict'[\s\S]*?RequestTypeDerivationProofFor<'conflicted'>/.test(contract)],
  ['non-empty ledger algebra exists', /type RequestTypeNonEmptyLedger<T> = readonly \[T, \.\.\.T\[\]\]/.test(contract)],
  ['incomplete judgment cannot carry an empty unresolved ledger', /unresolved: RequestTypeNonEmptyLedger<RequestTypeUnresolvedRouteReceipt>/.test(contract)],
  ['unresolved judgment entries are narrowed to unresolved dispositions', /type RequestTypeUnresolvedRouteReceipt = Omit<RequestTypeRouteReceipt, 'disposition'>[\s\S]*?kind: 'unresolved'/.test(contract)],
  ['conflict judgment cannot carry an empty conflict ledger', /conflicts: RequestTypeNonEmptyLedger<RequestTypeDerivationConflict>/.test(contract)],
  ['conflicted proof closure requires a non-empty proof conflict ledger', /Kind extends 'conflicted'[\s\S]*?RequestTypeNonEmptyLedger<RequestTypeDerivationConflict>/.test(contract)],
  ['non-conflicted proof closures require an empty conflict ledger', /: readonly \[\]/.test(contract)],
  ['proof carries its own conflict ledger', /interface RequestTypeDerivationProof[\s\S]*?readonly conflicts: readonly RequestTypeDerivationConflict\[\]/.test(contract)],
  ['policy states outcome and closure coherence', /outcomeCoherence: Readonly<\{[\s\S]*?derived: 'closed_with_empty_conflict_ledger'[\s\S]*?incomplete: 'incomplete_with_nonempty_unresolved_ledger'[\s\S]*?conflict: 'conflicted_with_nonempty_conflict_ledger'/.test(contract)],
  ['policy requires judgment groups to match proof outputs', /judgmentGroups: 'equal_group_receipt_results'/.test(contract)],
  ['policy requires judgment ledgers to match proof ledgers', /proofLedgers: 'judgment_ledgers_equal_proof_ledgers'/.test(contract)],
  ['judgment-kind closure law is declared', /judgment_kind_matches_closure/.test(contract)],
  ['judgment output proof law is declared', /judgment_payload_matches_proof_ledger/.test(contract)],
  ['incomplete ledger coherence law is declared', /incomplete_judgment_matches_unresolved_ledger/.test(contract)],
  ['conflict ledger coherence law is declared', /conflict_judgment_matches_conflict_ledger/.test(contract)],
  ['verifier distinguishes judgment closure mismatch', /judgment_kind_closure_mismatch/.test(contract)],
  ['verifier distinguishes output mismatch', /judgment_groups_mismatch_proof_outputs/.test(contract)],
  ['verifier distinguishes unresolved ledger mismatch', /incomplete_ledger_mismatch/.test(contract)],
  ['verifier distinguishes conflict ledger mismatch', /conflict_ledger_mismatch/.test(contract)],
  ['previous transition algebra remains present', /contribution_transition_is_contiguous/.test(contract) && /contribution_transition_matches_policy/.test(contract) && /group_result_matches_final_transition/.test(contract)],
  ['group receipt continues to carry complete result', /readonly result: RequestType;/.test(contract)],
  ['source-domain evidence keys remain tagged', /`route:\$\{string\}`/.test(contract) && /`resource:\$\{string\}`/.test(contract) && /`request:\$\{string\}`/.test(contract)],
  ['authority interface returns judgment and verification contracts', /derive: \(input: RequestTypeDerivationInput\) => RequestTypeDerivationJudgment/.test(contract) && /verify: \(input: RequestTypeDerivationInput, judgment: RequestTypeDerivationJudgment\) => RequestTypeDerivationVerification/.test(contract)],
  ['upstream barrel exports the interface', /export \* from '\.\/requestTypeDerivationInterface'/.test(barrel)],
];
const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  phase: 1564,
  audit: 'request-type-judgment-coherence',
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, ok]) => ({ name, passed: ok })),
  failures,
  scope: 'static interface-model audit only; no claim of authority implementation, scanner migration, runtime migration, package build, or Vitest validation',
  validationNotes: [
    'static interface audit only',
    'targeted global TypeScript 5.8.3 check reports 35 diagnostics in imported dependency modules and zero diagnostics directly on requestTypeDerivationInterface.ts',
    'scanner aggregator, scanner entrypoint, and runtime executor remain byte-for-byte unchanged from Phase 1563',
    'full package build and Vitest not run',
  ],
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
