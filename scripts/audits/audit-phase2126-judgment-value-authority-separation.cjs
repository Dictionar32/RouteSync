const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const execution = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const judgmentValue = judgment.split('export interface LaravelControllerActionSemanticJudgmentInterface<')[1]?.split('/** Stable obligations')[0] ?? '';
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const response = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const index = read('packages/core/src/index.ts');
const checks = [
  ['judgment interface is a data contract, not a callable authority', /readonly kind: 'controller_action_semantic_judgment_completed'[\s\S]*readonly invocationJudgment: TInvocationJudgment[\s\S]*readonly semantic: LaravelControllerActionSemanticKnowledge[\s\S]*readonly projection: TProjection/.test(judgmentValue) && !/readonly judge/.test(judgmentValue)],
  ['callable judgment production is separately named as an authority interface', /export interface LaravelControllerActionSemanticJudgmentAuthorityInterface[\s\S]*readonly judge:/.test(judgment)],
  ['scanner wiring depends on the authority contract rather than the judgment value contract', /readonly actionJudgment: LaravelControllerActionSemanticJudgmentAuthorityInterface</.test(dependencies)],
  ['runtime executor accepts only the completed judgment value', /readonly semanticJudgment: LaravelControllerActionSemanticJudgmentInterface</.test(execution)],
  ['runtime executor forwards the exact judgment object without reconstruction', /semanticJudgment: input\.semanticJudgment/.test(dependencies)],
  ['semantic knowledge and compiler projection remain distinct', /readonly semantic: LaravelControllerActionSemanticKnowledge;[\s\S]*readonly projection: TProjection/.test(judgment)],
  ['exact invocation judgment subtype survives the action judgment', /readonly invocationJudgment: TInvocationJudgment/.test(judgment) && /LaravelControllerActionSemanticJudgmentInterface<TProjection, TInvocationJudgment>/.test(judgment)],
  ['integrated controller response remains separately owned by the response pipeline', /integratedResponseOwnership: 'controller-wide-integrated-response-remains-owned-by-LaravelControllerResponseSemanticPipelineInterface-and-is-not-flattened-into-per-action-response'/.test(judgment) && /judgeIntegratedResponse\(/.test(scanner)],
  ['invocation remains a closed discriminated outcome union', /export type LaravelControllerInvocationSemanticJudgmentInterface\s*=\s*\n\s*\| LaravelControllerInvocationNotConnectedJudgment\s*\n\s*\| LaravelControllerInvocationSourceBindingRejectedJudgment\s*\n\s*\| LaravelControllerInvocationCompleteJudgment\s*\n\s*\| LaravelControllerInvocationBlockedJudgment/.test(invocation)],
  ['legacy resolver debt remains explicit and is not misreported as migrated', /resolveControllerActionContract/.test(judgment) && /scanControllerAction\(/.test(dependencies)],
  ['public exports expose judgment value and separate authority', /LaravelControllerActionSemanticJudgmentInterface, LaravelControllerActionSemanticJudgmentAuthorityInterface/.test(index)],
  ['interface declarations contain no semantic control-flow implementation', !/\b(if|switch|case)\s*\(/.test(judgment + execution)],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('BOUNDARY: judgment value and callable authority are separate; legacy action semantic derivation remains an open migration obligation.\n');
process.exitCode = failures === 0 ? 0 : 1;
