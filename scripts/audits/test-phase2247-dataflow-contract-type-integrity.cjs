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
const dataflow = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const resolver = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const authority = read('packages/core/src/types/upstream/controllerResourceBindingInterface.ts');
const action = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const runtime = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const response = read('packages/core/src/types/upstream/laravelControllerResponseSemanticPipeline.ts');
check('dataflow input uses the existing canonical ControllerResponseReferenceJudgment type', /readonly response: ControllerResponseReferenceJudgment;/.test(dataflow));
check('duplicated malformed response judgment type is absent', !/ControllerResponseReferenceJudgmentReferenceJudgment/.test(dataflow));
check('canonical response judgment type is imported from the existing controller domain contract', /import type \{[^}]*ControllerResponseReferenceJudgment[^}]*\} from '\.\.\/\.\.\/\.\.\/\.\.\/types\/upstream\/controller';/.test(dataflow));
check('resource candidate judgment remains owned by the existing upstream resource authority', /readonly judge: \(candidate: ControllerResourceBindingCandidate\) => ControllerResourceBindingJudgment/.test(authority));
check('resolver consumes typed source evidence and judges candidates through the existing authority', /controllerResourceReturnSourceEvidenceProjection\.project/.test(resolver) && /context\.resourceBindingAuthority\.judge\(evidence\.candidate\)/.test(resolver));
check('production resolver is retired from legacy dataflow projection while transitive relation debt remains disclosed', !/createControllerDataflowContract/.test(resolver) && /legacy_dataflow_relation_algebra/.test(action));
check('integrated response remains on the existing response pipeline', /judgeIntegratedResponse/.test(response));
check('runtime executor remains a judgment-forwarding boundary', /semanticJudgment/.test(runtime) && /runtime-executor-forwards-the-completed-judgment-without-semantic-reclassification/.test(action));
check('touched dataflow contract adds no semantic/foundation import', !/semantic\/foundation/.test(dataflow));
process.stdout.write(`Phase 2247 structural audit: ${passed}/9 passed\n`);
