const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const adapterPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/controllerDependencyEvidenceProjection.ts');
const wiringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/controllerDependencySemanticJudgmentInterface.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const adapter = fs.readFileSync(adapterPath, 'utf8');
const wiring = fs.readFileSync(wiringPath, 'utf8');
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const checks = [
  ['action contract projection has no subscanner dependency', !/from ['"].*operations\//.test(contract)],
  ['action contract projection has no dependency evidence derivation helpers', !/resolveControllerDependencyProducts|dependencySemanticInput|expressionArgumentsFromParameterAttribute/.test(contract)],
  ['dependency source adapter is explicitly parser-specific projection', adapter.includes("kind: 'controller_dependency_evidence_projection'") && adapter.includes('PHP controller parameter AST → existing upstream dependency evidence')],
  ['source adapter emits typed evidence without judging dependencies', adapter.includes('readonly ControllerDependencySemanticInput[]') && !/dependencyAuthority\.judge\(/.test(adapter)],
  ['upstream does not add a generic source-evidence wrapper', !upstream.includes('ControllerDependencySourceEvidenceProjectionInterface<TSourceEvidence>')],
  ['production composition applies the existing dependency judgment authority', wiring.includes('dependencySemanticJudgmentAuthority.judge(evidence)')],
  ['upstream dependency judgment input remains AST-independent', upstream.includes('AST-independent evidence for one constructor or action-method parameter') && !/ControllerParameterAst|PhpAstValue|operations/.test(upstream)],
  ['production action authority uses the source evidence projection', wiring.includes('controllerDependencyEvidenceProjection.project(') && !wiring.includes('resolveControllerDependencyProducts(')],
  ['source evidence projection does not create a parallel dependency authority', !/interface ControllerDependency.*AuthorityInterface/.test(adapter)],
  ['source adapter consumes existing PHP AST expression authority', adapter.includes('PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>') && adapter.includes('input.expressionAuthority.derive(')],
  ['source adapter has no direct subscanner or semantic-relations import', !/from ['"].*(operations|semantic\/relations)\//.test(adapter)],
  ['class-name judgment is supplied as a closed product, not recomputed in adapter', adapter.includes('classNameJudgment: evidence.classNameJudgment') && !adapter.includes('classNameJudgment.judge(')],
  ['production composition closes class-name judgments before evidence projection', wiring.includes('classNameJudgment: parameterClassNameJudgmentAuthority.judge(parameter.semantic)')],
  ['no semantic foundation dependency introduced', !/semantic\/foundation/.test(contract + adapter + wiring + upstream)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
