const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const rootExports = read('packages/core/src/index.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const controller = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scripts = JSON.parse(read('package.json')).scripts;
const judgmentBody = /interface LaravelControllerInvocationSemanticJudgmentInterface\s*\{([\s\S]*?)\n\}/.exec(judgment)?.[1] ?? '';
const checks = [
  ['judgment remains a value contract, not a callable authority', /readonly response: PhpSourceInvocationSemanticPipelineIntegrationResult/.test(judgmentBody) && !/readonly judge:/.test(judgmentBody)],
  ['authority dependencies are explicitly typed by their upstream owner interfaces', /interface LaravelControllerInvocationSemanticJudgmentAuthorityDependencies/.test(judgment) && /readonly sourceBinding: PhpSourceInvocationSemanticSourceBindingAuthorityInterface/.test(judgment) && /readonly integration: PhpSourceInvocationSemanticPipelineIntegrationInterface/.test(judgment)],
  ['authority execution delegates through its injected source-binding contract', /dependencies\.sourceBinding\.bind/.test(authority)],
  ['authority execution delegates integrated response projection through its injected contract', /dependencies\.integration\.project/.test(authority)],
  ['composition root is the only place selecting concrete source-binding and integration authorities', /createLaravelControllerInvocationSemanticJudgmentAuthority\([\s\S]*?sourceBinding: phpSourceInvocationSemanticSourceBindingAuthority[\s\S]*?integration: phpSourceInvocationSemanticPipelineIntegrationAuthority/.test(authority)],
  ['authority contract retains source identity and integrated response correlation', /source-identity-and-integrated-response-are-one-judgment-value-not-independent-artifact-fields/.test(authority) && /readonly sourceFile: SourceFile/.test(judgment) && /readonly response: PhpSourceInvocationSemanticPipelineIntegrationResult/.test(judgment)],
  ['missing delivery remains an explicit not-connected outcome', /controller_invocation_pipeline_not_provided/.test(judgment) && /php_source_invocation_pipeline_not_connected/.test(authority)],
  ['source mismatch remains an authority-produced integrated rejection', /dependencies\.sourceBinding\.bind/.test(authority) && /phpSourceInvocationPipelineEvidenceFromSourceBinding\(binding\)/.test(authority)],
  ['upstream barrel exports judgment and composition contracts', /export \* from '\.\/laravelControllerInvocationSemanticJudgmentInterface'/.test(barrel) && /createLaravelControllerInvocationSemanticJudgmentAuthority/.test(barrel)],
  ['package root exports dependency interface and authority composition', /LaravelControllerInvocationSemanticJudgmentAuthorityDependencies/.test(rootExports) && /createLaravelControllerInvocationSemanticJudgmentAuthority/.test(rootExports)],
  ['controller artifact keeps judgment and response correlated in one field', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(controller) && !/readonly invocationResponse:/.test(controller)],
  ['production wiring is honestly marked as not yet migrated', /ControllerScanner\.scanCanonicalBundle/.test(pipeline)],
  ['no semantic foundation dependency is introduced', !/semantic\/foundation/.test(judgment + authority)],
  ['audit is registered in package scripts', scripts['audit:phase1824-laravel-invocation-authority-dependency-contract'] === 'node scripts/audits/audit-phase1824-laravel-invocation-authority-dependency-contract.cjs'],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!pass);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed.\n`);
process.stdout.write('Production status: UPSTREAM AUTHORITY DEPENDENCIES ARE CONTRACTED; production scanner wiring and legacy subscanner retirement remain outstanding.\n');
process.exitCode = failures === 0 ? 0 : 1;
