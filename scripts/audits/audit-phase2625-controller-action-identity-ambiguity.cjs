const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const bindingContract = read('packages/core/src/types/upstream/controllerActionBinding.ts');
const bindingAlgebra = read('packages/core/src/types/upstream/controllerActionBindingAlgebra.ts');
const policyContract = read('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts');
const routeProjection = read('packages/core/src/types/upstream/routeActionPolicyRelations.ts');
const sourceModel = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const test = read('packages/core/src/types/upstream/controllerActionBindingAlgebra.phase2625.test.ts');

assert.match(bindingContract, /kind: 'supplied_policy_ambiguous'/);
assert.match(bindingContract, /kind: 'catalog_controller_ambiguous'/);
assert.match(bindingContract, /readonly controller: ControllerName/);
assert.match(bindingContract, /readonly action: ActionName/);
assert.match(bindingAlgebra, /input\.suppliedPolicies\.filter\(candidate => sameIdentity\(candidate\.identity, input\.identity\)\)/);
assert.match(bindingAlgebra, /input\.catalogControllers\.filter\(candidate => sameIdentity\(candidate\.identity, input\.identity\)\)/);
assert.doesNotMatch(bindingAlgebra, /suppliedPolicies\.find\(|catalogControllers\.find\(|matching\[0\]/);
assert.match(policyContract, /kind: 'controller_action_policy_binding_ambiguous'/);
assert.match(sourceModel, /binding\.kind === 'supplied_policy_ambiguous'/);
assert.match(sourceModel, /binding\.kind === 'catalog_controller_ambiguous'/);
assert.match(sourceModel, /controllerActionPolicyRelations\(blockedControllerActionPolicyForAmbiguity\(/);
assert.doesNotMatch(sourceModel, /effectivePolicies\.flatMap\(policy => controllerActionPolicyRelations\(policy\)\)/);
assert.match(routeProjection, /EffectiveControllerActionPolicyBlockReason/);
assert.match(test, /preserves duplicate supplied policy candidates as ambiguity/);
assert.match(test, /preserves duplicate controller candidates as ambiguity/);

process.stdout.write('Phase 2625 identity/ambiguity source audit: 11/11 assertions passed.\n');
