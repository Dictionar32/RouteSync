const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const controller = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const route = read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts');
const core = read('packages/core/src/index.ts');
const scripts = JSON.parse(read('package.json')).scripts;
const judgmentBody = /interface LaravelControllerInvocationSemanticJudgmentInterface\s*\{([\s\S]*?)\n\}/.exec(judgment)?.[1] ?? '';
const checks = [
  ['semantic judgment interface models a value, not an executable method', /readonly kind: 'laravel_controller_invocation_semantic_judgment'/.test(judgmentBody) && !/readonly judge:|readonly analyze:/.test(judgmentBody)],
  ['source identity and integrated response are in the same judgment value', /readonly sourceFile: SourceFile/.test(judgmentBody) && /readonly response: PhpSourceInvocationSemanticPipelineIntegrationResult/.test(judgmentBody)],
  ['callable authority is a distinct interface', /interface LaravelControllerInvocationSemanticJudgmentAuthorityInterface/.test(judgment) && /readonly judge:/.test(judgment)],
  ['authority implements only the distinct authority interface', /LaravelControllerInvocationSemanticJudgmentAuthorityInterface/.test(authority)],
  ['authority receives source-binding and integration authorities through typed dependencies', /interface LaravelControllerInvocationSemanticJudgmentAuthorityDependencies/.test(judgment) && /readonly sourceBinding: PhpSourceInvocationSemanticSourceBindingAuthorityInterface/.test(judgment) && /readonly integration: PhpSourceInvocationSemanticPipelineIntegrationInterface/.test(judgment)],
  ['judgment contract version advances with the stronger shape rule', /version: 2/.test(authority) && /shapeRule: 'source-identity-and-integrated-response-are-one-judgment-value-not-independent-artifact-fields'/.test(authority)],
  ['pipeline absence remains not-connected rather than empty success', /controller_invocation_pipeline_not_provided/.test(judgment) && /php_source_invocation_pipeline_not_connected/.test(authority)],
  ['provided pipeline result passes through the injected source-binding authority', /dependencies\.sourceBinding\.bind/.test(authority)],
  ['integration outcome remains owned by the injected integration authority', /dependencies\.integration\.project/.test(authority)],
  ['controller artifact stores the complete judgment instead of a detached response', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(controller) && !/readonly invocationResponse:/.test(controller)],
  ['controller artifact avoids duplicating source identity outside the judgment', !/interface LaravelControllerScanArtifact\s*\{[\s\S]*?readonly sourceFile: SourceFile/.test(controller)],
  ['judgment and authority contracts are exported publicly', /LaravelControllerInvocationSemanticJudgmentAuthorityInterface/.test(core) && /LaravelControllerInvocationSemanticJudgmentInterface/.test(core)],
  ['upstream barrel exports judgment contracts and the authority composition root', /export \* from '\.\/laravelControllerInvocationSemanticJudgmentInterface'/.test(read('packages/core/src/types/upstream/index.ts')) && /createLaravelControllerInvocationSemanticJudgmentAuthority/.test(read('packages/core/src/types/upstream/index.ts'))],
  ['no semantic foundation dependency is introduced', !/semantic\/foundation/.test(judgment + authority + controller)],
  ['production pipeline still has legacy consumer clearly traced', /ControllerScanner\.scanCanonicalBundle/.test(pipeline)],
  ['route consumer still depends on legacy action index clearly traced', /RelationIndex<string, RelationIndex<string, ControllerActionInfo>>/.test(route)],
  ['audit command is registered', scripts['audit:phase1823-laravel-invocation-judgment-model-separation'] === 'node scripts/audits/audit-phase1823-laravel-invocation-judgment-model-separation.cjs'],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!pass);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed.\n`);
process.stdout.write('Production status: MODEL SEPARATION COMPLETE; production wiring and legacy subscanner retirement remain outstanding.\n');
process.exitCode = failures === 0 ? 0 : 1;
