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
const projection = read('packages/core/src/types/upstream/controllerResourceReturnSourceEvidenceProjectionInterface.ts');
const resolver = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const dataflow = read('packages/core/src/compiler/scanner/operations/controller/controllerDataflowContract.ts');
const authority = read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const executor = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const response = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
const report = read('packages/core/src/types/upstream/docs/PHASE2250-UPSTREAM-FIRST-LARAVEL-SCANNER-RETIREMENT-TRACE.md');
check('canonical action knowledge is closed in the judgment model while migration debt stays contract-level', /readonly semantic: LaravelControllerActionSemanticKnowledge/.test(action) && /readonly projectionMigration: LaravelControllerActionProjectionMigration/.test(action) && !/action_semantic_knowledge_partial/.test(action));
check('resource-return projection is an upstream contract and exported by the previous phase', /ControllerResourceReturnSourceEvidenceProjectionInterface/.test(projection));
check('projection contract does not import parser AST or relation/foundation implementations', !/compiler\/lexer|semantic\/relations|semantic\/foundation/.test(projection));
check('production resolver now consumes the upstream resource-return evidence projection', /controllerResourceReturnSourceEvidenceProjection\.project\(/.test(resolver) && /ControllerResourceReturnSourceEvidenceProjectionInterface/.test(projection));
check('legacy dataflow contract still owns recursive resource AST traversal', /collectResourceBindingsWithIndex/.test(dataflow) && /collectResourceBindingsWithIndex\(value/.test(dataflow));
check('legacy dataflow contract still imports semantic relations', /semantic\/relations\//.test(dataflow));
check('upstream dataflow authority no longer imports semantic relations directly', !/semantic\/relations\//.test(authority));
check('production action wiring still calls the legacy resolver', /resolveControllerActionContract\(/.test(wiring));
check('production action wiring still imports controller AST canonicalization', /operations\/controller\/controllerAstCanonical/.test(wiring));
check('resource judgment remains owned by the existing upstream authority', /ControllerResourceBindingAuthorityInterface/.test(projection) && /resourceBindingAuthority: controllerResourceBindingAuthority/.test(wiring) && /controllerResourceBindingAuthority/.test(wiring));
check('integrated response remains owned by the existing response pipeline', /judgeIntegratedResponse/.test(response));
check('runtime executor contract forbids semantic reclassification', /without-semantic-reclassification/.test(action) && /semanticJudgment/.test(executor));
check('trace documents that projection declaration alone was not sufficient and production wiring was later cut over', /does not yet inject and consume it/.test(report) && /controllerResourceReturnSourceEvidenceProjection\.project/.test(resolver));
check('trace prohibits premature retirement before output parity', /Only then retire/.test(report));
check('trace requires transitive checks for relations and foundation', /transitive production imports/.test(report));
process.stdout.write(`Upstream-first Laravel scanner retirement regression trace: ${passed}/15 passed\n`);
