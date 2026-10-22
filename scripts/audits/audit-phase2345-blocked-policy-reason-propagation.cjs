const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const relation = read('packages/core/src/types/upstream/controllerActionPolicyRelations.ts');
const policy = read('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts');
const test = read('packages/core/src/types/upstream/__tests__/controller-action-policy-blocked-judgment.phase1972.test.ts');
const resolver = read('packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts');
const manifest = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const checks = [
  ['blocked relation reasons use the canonical upstream block-reason union', /reasons: readonly EffectiveControllerActionPolicyBlockReason\[\]/.test(relation) && /import type \{ EffectiveControllerActionPolicyBlockReason \}/.test(relation)],
  ['canonical block-reason union includes inventory-unavailable judgment', /controller_policy_inventory_unavailable/.test(policy)],
  ['blocked relation projection preserves exact judgment reasons', /reasons: policy\.judgment\.reasons/.test(relation)],
  ['blocked relation does not expose middleware or authorization products', (() => { const projection = relation.split('export const controllerActionPolicyRelations =')[1] ?? ''; const blocked = projection.split("case 'blocked':")[1]?.split("case 'complete':")[0] ?? ''; return /kind: 'controller_action_policy_blocked'/.test(blocked) && !/middleware:|authorization:/.test(blocked); })()],
  ['regression covers unavailable inherited controller inventory', /preserves inventory-unavailable reasons/.test(test) && /controller_policy_inventory_unavailable/.test(test)],
  ['resolver blocks missing inherited inventory instead of fabricating policy', /missingControllers\.length > 0/.test(resolver) && /kind: 'blocked' as const/.test(resolver)],
  ['manifest builder preserves blocked projection as a typed judgment', /projection\.kind !== 'laravel_source_ast_projection_complete'/.test(manifest) && /kind: 'manifest_builder_blocked'/.test(manifest)],
  ['no semantic foundation dependency introduced into changed authority path', !/semantic\/foundation/.test(relation)],
  ['no parallel V2 policy relation contract introduced', !/ControllerActionPolicyRelationV2/.test(relation)],
  ['existing relation projection remains the canonical policy projection', /export const controllerActionPolicyRelations =/.test(relation)],
  ['source model still consumes canonical policy projection', /controllerActionPolicyRelations\(policy\)/.test(read('packages/core/src/types/upstream/highLevelSourceModel.ts'))],
  ['audit test and docs live under canonical repository paths', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/__tests__/controller-action-policy-blocked-judgment.phase1972.test.ts'))],
];
let passed = 0;
for (const [label, result] of checks) {
  const ok = result;
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (ok) passed += 1;
}
process.stdout.write(`\n${passed}/${checks.length} checks passed\n`);
process.exitCode = passed === checks.length ? 0 : 1;
