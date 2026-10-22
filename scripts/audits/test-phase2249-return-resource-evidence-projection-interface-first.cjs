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
const projection = read('packages/core/src/types/upstream/controllerResourceReturnSourceEvidenceProjectionInterface.ts');
const action = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const resolver = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const dataflow = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const semanticAuthority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const resourceAuthority = read('packages/core/src/types/upstream/controllerResourceBindingAuthority.ts');
const responsePipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const executor = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
check('upstream source-evidence projection contract is declared with a closed named input/output shape', /ControllerResourceReturnSourceEvidenceProjectionInterface/.test(projection) && /ControllerResourceReturnSourceEvidenceProjectionInput/.test(projection) && /ControllerResourceReturnSourceEvidence</.test(projection));
check('upstream contract has no compiler AST imports and does not depend on semantic relations/foundation', !/compiler\/lexer|semantic\/relations|semantic\/foundation/.test(projection));
check('new upstream interface is exported through the existing upstream barrel', /export \* from '\.\/controllerResourceReturnSourceEvidenceProjectionInterface'/.test(barrel));
check('new interface does not introduce loose unknown/any or assertion-based semantic shortcuts', !/\bunknown\b|\bany\b|\bas\s+(?:const|unknown|any)\b/.test(projection));
check('projection contract declares syntax-only ownership and delegates applicability to existing resource authority', /source-shape-only/.test(projection) && /ControllerResourceBindingAuthorityInterface-owns-applicability-and-closed-resource-judgment/.test(projection));
check('projection output preserves source location with each candidate', /readonly source: TSourceLocation/.test(projection) && /readonly candidate: ControllerResourceBindingCandidate/.test(projection));
check('production resolver uses the upstream projection and existing resource authority rather than duplicating semantic ownership', /controllerResourceReturnSourceEvidenceProjection\.project/.test(resolver) && /ControllerResourceBindingAuthorityInterface/.test(projection) && /resourceBindingAuthority\.judge/.test(resolver));
check('action contract and production wiring are aligned at version 45', /readonly version: 45;/.test(action) && /version: 45 as const/.test(wiring));
check('production resolver consumes the source projection and no longer imports the legacy projection', /controllerResourceReturnSourceEvidenceProjection\.project/.test(resolver) && !/createControllerDataflowContract/.test(resolver));
check('direct dataflow authorities are relation/foundation-free while transitive knowledge and collection debt remains explicit', !/semantic\/relations|semantic\/foundation/.test(semanticAuthority) && /transitive_dataflow_knowledge_and_collection_vocabulary_dependencies/.test(action));
check('direct canonical authority is relation-free while transitive knowledge and collection dependencies remain the documented migration frontier', !/semantic\/relations|semantic\/foundation/.test(semanticAuthority) && /semantic\/relations\//.test(read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts') + read('packages/core/src/types/upstream/collections.ts')));
check('existing resource authority remains the sole semantic resource judge', /ControllerResourceBindingAuthorityInterface/.test(projection) && /judge:/.test(resourceAuthority));
check('integrated response remains owned by the existing response pipeline', /judgeIntegratedResponse/.test(responsePipeline));
check('runtime executor continues forwarding semantic judgment rather than classifying it', /semanticJudgment/.test(executor) && /without-semantic-reclassification/.test(action));
process.stdout.write(`Phase 2249 return-resource evidence projection interface-first audit: ${passed}/14 passed\n`);
