const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const values = read('src/types/upstream/valueObjects.ts');
const names = read('src/types/upstream/names.ts');
const contract = read('src/types/upstream/controllerResourceBindingInterface.ts');
const authority = read('src/types/upstream/controllerResourceBindingAuthority.ts');
const wiring = read('src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const checks = [
  ['no duplicate generic StringValue equality authority was introduced', !/StringValueEqualityInterface|stringValueEquality/.test(values)],
  ['existing typed name operations own value equality directly', /classNameEquals = .*Object\.is/.test(names) && /variableNameEquals = .*Object\.is/.test(names) && /modelNameMatchesClassName = .*Object\.is/.test(names) && /methodNameEquals = .*Object\.is/.test(names) && !/semantic\/(relations|foundation)\//.test(names)],
  ['resource binding authority no longer imports semantic relation/foundation modules', !/semantic\/(relations|foundation)\//.test(authority)],
  ['static-call rule applicability uses typed method-name equality', /methodNameEquals\(rule\.methodName, candidate\.methodName\)/.test(authority)],
  ['authority contract version 8 is synchronized', /readonly contractVersion: 8/.test(contract) && /contractVersion: 8/.test(authority)],
  ['authority contract metadata matches its interface declarations', /judgmentContract: 'closed_model_origin_judgment_and_canonical_controller_response_are_correlated_and_static_call_applicability_is_judged_upstream'/.test(authority) && /responseContractRule: 'reuse_declared_response_reference_judgment_without_claiming_http_return_presence'/.test(authority)],
  ['canonical resource publication remains owned by the same authority', /publishResolved: \(input: ControllerResourceBindingPublicationInput\) => Object\.freeze/.test(authority)],
  ['integrated response pipeline remains the existing response owner', /LaravelControllerResponseSemanticPipelineInterface/.test(read('src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts')) && /judgeIntegratedResponse/.test(read('src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts'))],
  ['CLI execution path remains visible for next migration', /scanControllerAction/.test(wiring) && /controllerBodySemanticJudgmentAuthority/.test(wiring)],
  ['remaining subscanner dependency is not misreported as retired', /subscanners\/controller/.test(wiring)],
  ['regression test for upstream equality authority exists', fs.existsSync(path.join(root, 'src/types/upstream/__tests__/controller-resource-binding-no-relation-authority.phase2235.test.ts'))],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
