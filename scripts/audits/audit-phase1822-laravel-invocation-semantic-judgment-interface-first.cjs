const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const coreExports = read('packages/core/src/index.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/ControllerScanner.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['input is a closed ADT for absent versus supplied whole-file pipeline evidence', /controller_invocation_pipeline_not_provided/.test(contract) && /controller_invocation_pipeline_provided/.test(contract)],
  ['each input carries a domain SourceFile identity', /readonly sourceFile: SourceFile/.test(contract)],
  ['provided pipeline result uses the canonical upstream pipeline result type', /readonly pipelineResult: PhpSourceInvocationSemanticPipelineResult/.test(contract)],
  ['judgment value itself owns source identity and integrated response', /interface LaravelControllerInvocationSemanticJudgmentInterface[\s\S]*?readonly sourceFile: SourceFile;[\s\S]*?readonly response: PhpSourceInvocationSemanticPipelineIntegrationResult/.test(contract)],
  ['contract forbids batch lookup and cross-file joining', /one-source-correlated-input-per-controller-file-no-batch-index-lookup-or-cross-file-join/.test(contract)],
  ['callable authority is distinct from judgment value interface', /interface LaravelControllerInvocationSemanticJudgmentAuthorityInterface/.test(contract) && /LaravelControllerInvocationSemanticJudgmentAuthorityInterface/.test(authority)],
  ['judgment interface is not itself a callable boundary', !(/interface LaravelControllerInvocationSemanticJudgmentInterface\s*\{([\s\S]*?)\n\}/.exec(contract)?.[1] ?? '').includes('readonly judge:')],
  ['controller artifact carries one correlated judgment instead of a separate response field', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts')) && !/readonly invocationResponse:/.test(read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts'))],
  ['authority delegates source identity binding through its injected owner interface', /dependencies\.sourceBinding\.bind/.test(authority)],
  ['authority delegates integrated projection through its injected owner interface', /dependencies\.integration\.project/.test(authority)],
  ['absent pipeline remains explicit not-connected evidence', /php_source_invocation_pipeline_not_connected/.test(authority)],
  ['provided pipeline path retains source-binding judgment before integration', /phpSourceInvocationPipelineEvidenceFromSourceBinding\(binding\)/.test(authority)],
  ['judgment source identity is retained beside integrated response', /sourceFile: input\.sourceFile/.test(authority) && /response:/.test(authority)],
  ['judgment, separate callable authority contract, and authority are exported from core', /LaravelControllerInvocationSemanticJudgmentInterface/.test(coreExports) && /LaravelControllerInvocationSemanticJudgmentAuthorityInterface/.test(coreExports) && /laravelControllerInvocationSemanticJudgmentAuthority/.test(coreExports)],
  ['no semantic foundation dependency is introduced', !/semantic\/foundation/.test(contract + authority)],
  ['audit script is registered in package scripts', packageJson.scripts['audit:phase1822-laravel-invocation-semantic-judgment-interface-first'] === 'node scripts/audits/audit-phase1822-laravel-invocation-semantic-judgment-interface-first.cjs'],
  ['legacy scanner is still detected as an outstanding consumer', /class ControllerScanner/.test(scanner)],
  ['production pipeline migration is explicitly detected as outstanding', /ControllerScanner\.scanCanonicalBundle/.test(pipeline)],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!pass);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed.\n`);
process.stdout.write('Production status: JUDGMENT VALUE AND CALLABLE AUTHORITY ARE NOW SEPARATE; production scanner wiring and subscanner retirement remain blocked until source-correlated judgments replace legacy controller bundle consumers.\n');
process.exitCode = failures === 0 ? 0 : 1;
