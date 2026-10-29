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
const semanticAuthority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const integratedResponse = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const runtimeExecutor = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
check('action semantic contract and production wiring both advance to version 45', /readonly version: 45;/.test(action) && /version: 45 as const/.test(wiring));
check('relation algebra debt is an explicit closed ownership obligation, not hidden in prose only', /kind: 'legacy_dataflow_relation_algebra'/.test(action) && /transitive_dataflow_knowledge_and_collection_vocabulary_dependencies/.test(action));
check('relation algebra target reuses existing typed judgment/evidence contracts instead of naming a duplicate authority', /existing_typed_closed_judgment_and_source_evidence_contracts_without_semantic_relations/.test(action));
check('production action resolver no longer calls the legacy dataflow projection', !/createControllerDataflowContract\(/.test(resolver) && /controllerResourceReturnSourceEvidenceProjection\.project/.test(resolver));
check('production resource projection adapter and resolver are relation/foundation-free', !/semantic\/relations|semantic\/foundation/.test(read('packages/core/src/compiler/frontend/php/routeAst/controllerResourceReturnSourceEvidenceProjection.ts') + resolver));
check('canonical dataflow authority and direct correspondence/identity/flow authorities no longer import relation helpers', !/semantic\/relations|semantic\/foundation/.test(semanticAuthority + read('packages/core/src/types/upstream/controllerDataflowBindingPayloadCorrespondenceAuthority.ts') + read('packages/core/src/types/upstream/controllerDataflowVariableIdentityAuthority.ts') + read('packages/core/src/types/upstream/controllerSemanticVariableFlowCompositionAuthority.ts')));
check('resource judgment delegates to the existing injected upstream authority', /context\.resourceBindingAuthority\.judge\(evidence\.candidate\)/.test(resolver) && /ControllerResourceBindingAuthorityInterface/.test(resolver));
check('integrated response stays on the existing response semantic pipeline', /judgeIntegratedResponse/.test(integratedResponse) && /LaravelControllerResponseSemanticPipelineInterface/.test(action));
check('runtime executor remains judgment-forwarding and does not claim semantic classification ownership', /semanticJudgment/.test(runtimeExecutor) && /without-semantic-reclassification/.test(action));
check('the touched authority contract introduces no semantic/foundation import', !/semantic\/foundation/.test(action) && !/semantic\/foundation/.test(wiring));
process.stdout.write(`Phase 2248 interface-first dataflow relation closure audit: ${passed}/10 passed\n`);
