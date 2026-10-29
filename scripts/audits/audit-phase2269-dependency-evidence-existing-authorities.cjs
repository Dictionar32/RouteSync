const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const adapter = read('packages/core/src/compiler/scanner/wiring/controllerDependencyEvidenceProjection.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const upstream = read('packages/core/src/types/upstream/controllerDependencySemanticJudgmentInterface.ts');
const resolver = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const checks = [
  ['generic source-evidence wrapper removed from upstream', !upstream.includes('ControllerDependencySourceEvidenceProjectionInterface<TSourceEvidence>')],
  ['source projection is parser-specific and non-generic', adapter.includes('ControllerDependencyEvidenceProjectionInterface') && adapter.includes('ControllerParameterAst') && !adapter.includes('<TSourceEvidence>')],
  ['source projection does not import operations', !/from ['"].*operations\//.test(adapter)],
  ['source projection does not import semantic relations or foundation', !/from ['"].*semantic\/(relations|foundation)\//.test(adapter)],
  ['source projection delegates expression derivation to existing authority', adapter.includes('PhpAstExpressionSemanticAuthorityInterface<PhpAstValue>') && adapter.includes('input.expressionAuthority.derive(')],
  ['source projection consumes precomputed class-name judgment', adapter.includes('classNameJudgment: evidence.classNameJudgment') && !adapter.includes('classNameJudgment.judge(')],
  ['composition closes class-name judgments before source projection', wiring.includes('classNameJudgment: parameterClassNameJudgmentAuthority.judge(parameter.semantic)')],
  ['existing dependency judgment authority remains semantic owner', wiring.includes('dependencySemanticJudgmentAuthority.judge(evidence)')],
  ['action resolver remains free of dependency evidence construction', !/resolveControllerDependencyProducts|dependencySemanticInput|expressionArgumentsFromParameterAttribute/.test(resolver)],
  ['no semantic foundation dependency in changed path', !/semantic\/foundation/.test(adapter + wiring + upstream + resolver)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
