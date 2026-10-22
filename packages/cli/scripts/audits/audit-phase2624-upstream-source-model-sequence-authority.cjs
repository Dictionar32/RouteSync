const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const sourceModel = read('core/src/types/upstream/highLevelSourceModel.ts');
const collections = read('core/src/types/upstream/collections.ts');
const upstreamIndex = read('core/src/types/upstream/index.ts');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'cli/package.json'), 'utf8'));
const bindingContract = read('core/src/types/upstream/controllerActionBinding.ts');
const bindingAlgebra = read('core/src/types/upstream/controllerActionBindingAlgebra.ts');
const checks = [
  ['source model no longer imports semantic/relations primitives', !/from ['"]\.\.\/\.\.\/semantic\/relations\//.test(sourceModel)],
  ['Sequence ADT operations have an upstream-owned interface', /export interface SequenceAlgebraInterface/.test(collections)],
  ['Sequence algebra value follows export const name:interface', /export const sequenceAlgebra:\s*SequenceAlgebraInterface\s*=/.test(collections)],
  ['Sequence algebra has an explicit closed-ADT contract version', /kind: 'upstream_sequence_algebra'[\s\S]*contractVersion: 1/.test(collections)],
  ['source model uses canonical upstream Sequence algebra for traversal', /sequenceAlgebra\.(toArray|project|expand|fromArray)/.test(sourceModel)],
  ['source model no longer defines duplicate local Sequence traversal helpers', !/const sequence(ToArray|Project|Expand|FromArray)\s*=/.test(sourceModel)],
  ['controller/action binding uses the canonical typed identity contract', /readonly controller: ControllerName/.test(bindingContract) && /readonly action: ActionName/.test(bindingContract)],
  ['controller/action binding preserves supplied-policy ambiguity', /kind: 'supplied_policy_ambiguous'/.test(bindingContract) && /supplied\.length > 1/.test(bindingAlgebra)],
  ['controller/action binding preserves catalog ambiguity without first-match lookup', /kind: 'catalog_controller_ambiguous'/.test(bindingContract) && !/catalogControllers\.find\(/.test(bindingAlgebra)],
  ['source-model policy lookup emits an explicit blocked ambiguity judgment', /blockedControllerActionPolicyForAmbiguity/.test(sourceModel) && /controller_action_policy_binding_ambiguous/.test(read('core/src/types/upstream/effectiveControllerActionPolicy.ts'))],
  ['source-model policy inventory has no duplicate direct success projection', !/effectivePolicies\.flatMap\(policy => controllerActionPolicyRelations\(policy\)\)/.test(sourceModel)],
  ['upstream barrel exports the collections owner', /export \* from ['"]\.\/collections['"]/.test(upstreamIndex)],
  ['Phase 2624 audit is registered in CLI package scripts', typeof packageJson.scripts['audit:phase2624-upstream-source-model-sequence-authority'] === 'string'],
  ['Phase 2625 identity ambiguity audit is registered in CLI package scripts', typeof packageJson.scripts['audit:phase2625-controller-action-identity-ambiguity'] === 'string'],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
