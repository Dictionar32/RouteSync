const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
let passed = 0;
const check = (label, condition) => {
  if (!condition) {
    process.stderr.write(`FAIL ${label}\n`);
    process.exitCode = 1;
    return;
  }
  passed += 1;
  process.stdout.write(`PASS ${label}\n`);
};
const contract = read('packages/core/src/types/upstream/controllerDependencySemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerDependencySemanticJudgmentAuthority.ts');
const resolver = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const action = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const tests = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.phase10.test.ts');
const resolverContext = resolver.slice(resolver.indexOf('export interface ControllerActionContractResolverContext'), resolver.indexOf('export function resolveControllerActionContract'));
check('resolver context has exactly one dependency authority property', (resolverContext.match(/readonly dependencySemanticJudgmentAuthority:/g) || []).length === 1);
check('upstream contract defines a closed dependency rule ADT', /export type ControllerDependencySemanticRule\s*=/.test(contract) && /readonly closed: true/.test(contract));
check('five dependency rules are declared in the upstream reasoning contract', ['unresolved-class-name-rule', 'constructor-dependency-rule', 'contextual-attribute-dependency-rule', 'method-route-parameter-exclusion-rule', 'method-container-dependency-rule'].every(rule => contract.includes(`readonly kind: '${rule}'`)));
check('authority implementation has no scanner, subscanner, relation, or foundation imports', !/from ['"][^'"]*(?:compiler\/scanner|subscanners|semantic\/relations|semantic\/foundation|relation|foundation)[^'"]*['"]/.test(authority));
check('upstream dependency authority contains no if statements, ternaries, or type assertions', !/\bif\s*\(|\?|\s+as\s+/.test(authority));
check('resolver delegates dependency judgments through the injected authority', /dependencyAuthority\.judge\(dependencySemanticInput\(/.test(resolver) && /dependencySemanticJudgmentAuthority: ControllerDependencySemanticJudgmentAuthorityInterface/.test(resolver));
check('legacy contextual-attribute classification was removed from resolver', !/CONTEXTUAL_ATTRIBUTE_KNOWLEDGE|resolveContextualAttributeResolution|function contextualAttributeName/.test(resolver));
check('production wiring injects the upstream dependency authority', /controllerDependencySemanticJudgmentAuthority/.test(wiring) && /dependencySemanticJudgmentAuthority,/.test(wiring));
check('action contract and production wiring are aligned at version 45', /readonly version: 45;/.test(action) && /version: 45 as const/.test(wiring));
check('existing integrated response owner remains unchanged', /LaravelControllerResponseSemanticPipelineInterface/.test(action) && /judgeIntegratedResponse/.test(read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts')));
check('runtime executor remains judgment-forwarding only', /execute: <TInvocationJudgment[\s\S]*?semanticJudgment: input\.semanticJudgment/.test(wiring) && /without-deriving-it-from-a-consumer-projection/.test(read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts')));
check('dependency regression tests inject the upstream authority', /dependencySemanticJudgmentAuthority: controllerDependencySemanticJudgmentAuthority/.test(tests) && /contextual_attribute/.test(tests));
process.stdout.write(`Phase 2244 structural audit: ${passed}/12 passed\n`);
