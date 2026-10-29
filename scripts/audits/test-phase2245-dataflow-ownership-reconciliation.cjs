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
const action = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const resolver = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const dataflow = read('packages/core/src/compiler/scanner/operations/controller/controllerDataflowContract.ts');
const resourceProjection = read('packages/core/src/types/upstream/controllerResourceReturnSourceEvidenceProjectionInterface.ts');
const executor = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const dependencyAuthority = read('packages/core/src/types/upstream/controllerDependencySemanticJudgmentAuthority.ts');
const resolverContext = resolver.slice(resolver.indexOf('export interface ControllerActionContractResolverContext'), resolver.indexOf('export function resolveControllerActionContract'));
check('action contract and production wiring are aligned at version 45', /readonly version: 45;/.test(action) && /version: 45 as const/.test(wiring));
check('resource return evidence projection is consumed by the production resolver', /controllerResourceReturnSourceEvidenceProjection\.project/.test(resolver) && !/createControllerDataflowContract/.test(resolver));
check('dataflow obligation names the existing resource-binding authority rather than a duplicate authority', /controllerResourceReturnSourceEvidenceProjection.project/.test(resolver) && /ControllerResourceBindingAuthorityInterface/.test(resourceProjection));
check('resolver context contains one dependency authority property', (resolverContext.match(/readonly dependencySemanticJudgmentAuthority:/g) || []).length === 1);
check('dependency semantic authority remains free of scanner, subscanner, relation, and foundation imports', !/from ['"][^'"]*(?:compiler\/scanner|operations|semantic\/relations|semantic\/foundation|relation|foundation)[^'"]*['"]/.test(dependencyAuthority));
check('resolver continues to use the existing dependency judgment authority', /dependencyAuthority\.judge\(dependencySemanticInput\(/.test(resolver));
check('legacy projection is no longer imported by the production resolver while transitive relation debt remains explicit', !/createControllerDataflowContract/.test(resolver) && /legacy_dataflow_relation_algebra/.test(action));
check('resource-binding judgment remains delegated to the existing upstream authority', /resourceBindingAuthority\.judge\(/.test(dataflow) && /ControllerResourceBindingAuthorityInterface/.test(dataflow) && /ControllerResourceBindingAuthorityInterface/.test(resourceProjection));
check('integrated response ownership remains unchanged', /LaravelControllerResponseSemanticPipelineInterface/.test(action) && /judgeIntegratedResponse/.test(read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts')));
check('runtime executor forwards the semantic judgment without reclassification', /semanticJudgment: input\.semanticJudgment/.test(wiring) && /without-deriving-it-from-a-consumer-projection/.test(executor));
process.stdout.write(`Phase 2245 structural audit: ${passed}/10 passed\n`);
