const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationInterface.ts'), 'utf8');
const barrel = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/index.ts'), 'utf8');
const includes = (value) => contract.includes(value);
const checks = [
  ['interface remains declaration-only', !includes('export const ') && !includes('Object.freeze')],
  ['verification exposes valid proof kind', includes("kind: 'valid';") && includes("proofKind: 'request_type_derivation_proof'")],
  ['invalid verification is a named counterexample union', includes('export type RequestTypeDerivationVerificationFailure =') && includes('| RequestTypeDerivationVerificationFailure;')],
  ['each invalid variant has an evidence payload', (contract.match(/readonly kind: 'invalid';/g) || []).length === (contract.match(/readonly evidence: Readonly</g) || []).length],
  ['inventory and coverage failures identify domain and key sets', includes("reason: 'source_inventory_mismatch' | 'source_receipt_coverage_mismatch'") && includes("readonly domain: 'routes' | 'resources' | 'requests'") && includes('readonly expectedKeys: readonly RequestTypeEvidenceKey[]') && includes('readonly actualKeys: readonly RequestTypeEvidenceKey[]')],
  ['source-key mismatch carries source domain and key', includes("readonly reason: 'source_key_domain_mismatch'") && includes('readonly sourceKind: RequestTypeSourceEvidenceIdentity[\'kind\']') && includes('readonly semanticKey: RequestTypeEvidenceKey')],
  ['route disposition failures identify route and expected/actual states', includes("readonly reason: 'route_disposition_mismatch' | 'request_binding_disposition_mismatch'") && includes('readonly route: RequestTypeRouteEvidenceReference') && includes('readonly expected: RequestTypeRouteDisposition[\'kind\']')],
  ['group membership failures identify group and route sets', includes("readonly reason: 'group_membership_mismatch' | 'contribution_ledger_mismatch'") && includes('readonly expectedRoutes: readonly RequestTypeRouteEvidenceKey[]') && includes('readonly actualRoutes: readonly RequestTypeRouteEvidenceKey[]')],
  ['output failures carry expected and actual semantic outputs', includes("readonly reason: 'group_output_mismatch' | 'judgment_groups_mismatch_proof_outputs'") && includes('readonly expected: readonly RequestType[]') && includes('readonly actual: readonly RequestType[]')],
  ['resource-resolution failures identify the affected route', includes("readonly reason: 'contributed_route_unresolved_resource'") && includes('readonly resolution: RequestTypeResourceResolution')],
  ['transition failures identify group, route, and transition', includes("readonly reason: 'contribution_transition_mismatch' | 'contribution_policy_mismatch'") && includes('readonly transition: RequestTypeGroupContributionReceipt')],
  ['invalid group key evidence can represent malformed keys', includes("readonly reason: 'invalid_group_key'") && includes('readonly actualGroupKey: string')],
  ['relation mismatch carries expected and actual relations', includes("readonly reason: 'relation_ledger_mismatch'") && includes('readonly expected: readonly RequestTypeDerivationRelation[]') && includes('readonly actual: readonly RequestTypeDerivationRelation[]')],
  ['policy mismatch carries expected and actual policies', includes("readonly reason: 'policy_mismatch'") && includes('readonly expectedPolicy: RequestTypeDerivationPolicy') && includes('readonly actualPolicy: RequestTypeDerivationPolicy')],
  ['closure failures carry expected and actual closure kinds', includes("readonly reason: 'closure_mismatch' | 'judgment_kind_closure_mismatch'") && includes("readonly expected: RequestTypeDerivationClosure['kind']") && includes("readonly actual: RequestTypeDerivationClosure['kind']")],
  ['incomplete-ledger mismatch carries both ledgers', includes("readonly reason: 'incomplete_ledger_mismatch'") && includes('readonly expected: readonly RequestTypeUnresolvedRouteReceipt[]') && includes('readonly actual: readonly RequestTypeUnresolvedRouteReceipt[]')],
  ['conflict-ledger mismatch carries both ledgers', includes("readonly reason: 'conflict_ledger_mismatch'") && includes('readonly expected: readonly RequestTypeDerivationConflict[]') && includes('readonly actual: readonly RequestTypeDerivationConflict[]')],
  ['judgment closure coherence remains represented', includes('judgment_kind_matches_closure') && includes("RequestTypeDerivationProofFor<'closed'>") && includes("RequestTypeDerivationProofFor<'incomplete'>") && includes("RequestTypeDerivationProofFor<'conflicted'>")],
  ['source identity remains domain tagged', includes('`route:${string}`') && includes('`resource:${string}`') && includes('`request:${string}`')],
  ['group output remains fully attested', includes('readonly result: RequestType;') && includes('group_receipt_matches_judgment_output')],
  ['contribution transitions remain replayable', includes("readonly before: RequestType | Readonly<{ readonly kind: 'group_absent' }>") && includes('readonly incoming: Readonly<') && includes('readonly after: RequestType')],
  ['authority interface returns semantic judgment and typed verification', includes('derive: (input: RequestTypeDerivationInput) => RequestTypeDerivationJudgment') && includes('verify: (input: RequestTypeDerivationInput, judgment: RequestTypeDerivationJudgment) => RequestTypeDerivationVerification')],
  ['upstream barrel exports request type interface', barrel.includes("export * from './requestTypeDerivationInterface'")],
];
const failures = checks.filter(([, ok]) => !ok).map(([name]) => name);
const report = {
  phase: 1565,
  audit: 'request-type-counterexample-interface',
  passed: checks.length - failures.length,
  total: checks.length,
  checks: checks.map(([name, ok]) => ({ name, passed: ok })),
  failures,
  scope: 'static interface-model audit only; no claim of semantic authority implementation, scanner migration, runtime migration, package build, or Vitest validation',
  validationNotes: [
    'verification failures now carry typed counterexample evidence instead of only a reason string',
    'scanner aggregator, scanner entrypoint, and runtime executor are intentionally unchanged',
    'full package build and Vitest not run',
  ],
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
