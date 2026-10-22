const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const rootExports = read('packages/core/src/index.ts');
const upstreamExports = read('packages/core/src/types/upstream/index.ts');
const production = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const scripts = JSON.parse(read('package.json')).scripts;
const checks = [
  ['current scanner interface has superseded v6 contract', /readonly contractVersion: 7/.test(scanner)],
  ['scanner consumes only a validated judgment inventory rather than an injected authority', /readonly invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(scanner) && !/readonly invocationJudgmentAuthority/.test(scanner)],
  ['scanner input does not accept raw pipeline result', !/PhpSourceInvocationSemanticPipelineResult/.test(scanner)],
  ['old raw-delivery ADTs have been retired from the boundary', !/LaravelControllerInvocationDelivery|LaravelControllerInvocationSourceDelivery/.test(scanner)],
  ['source identity and integrated response remain correlated in the judgment', /readonly sourceFile: SourceFile/.test(judgment) && /readonly response: PhpSourceInvocationSemanticPipelineIntegrationResult/.test(judgment)],
  ['source binding and integration remain dependency-injected upstream', /readonly sourceBinding: PhpSourceInvocationSemanticSourceBindingAuthorityInterface/.test(judgment) && /readonly integration: PhpSourceInvocationSemanticPipelineIntegrationInterface/.test(judgment)],
  ['authority delegates binding and response projection', /dependencies\.sourceBinding\.bind/.test(authority) && /dependencies\.integration\.project/.test(authority)],
  ['boundary contract is version 43', /readonly version: 43/.test(scanner) && /version: 43/.test(scanner)],
  ['boundary describes judgment-only input', /judgmentInputBoundary/.test(scanner) && /scanner-receives-only-upstream-closed-invocation-judgments/.test(scanner)],
  ['boundary forbids unvalidated arrays and cross-file inference', /never-accepts-an-unvalidated-judgment-array/.test(scanner) && /no-batch-index-lookup-or-cross-file-inference/.test(scanner) === false],
  ['boundary requires a complete per-controller judgment inventory', /completeInventoryGate/.test(scanner) && /exactly-one-judgment-per-controller-source/.test(scanner)],
  ['boundary gates production migration on interface conformance', /productionInterfaceGate/.test(scanner)],
  ['scanner runtime remains artifact collection only', /source-artifact-collection-only-no-semantic-judgment-construction/.test(scanner)],
  ['package root exports the controller interface without obsolete delivery types', /LaravelControllerScannerInterface/.test(rootExports) && !/LaravelControllerInvocationDelivery|LaravelControllerInvocationSourceDelivery/.test(rootExports)],
  ['upstream barrel exports scanner contract', /export \* from '\.\/laravelControllerScannerInterface'/.test(upstreamExports)],
  ['production trace still exposes legacy wiring honestly', /ControllerScanner\.scanCanonicalBundle/.test(production)],
  ['no semantic foundation dependency is introduced', !/semantic\/foundation/.test(scanner + judgment + authority)],
  ['audit command remains registered', scripts['audit:phase1825-laravel-controller-production-boundary-interface'] === 'node scripts/audits/audit-phase1825-laravel-controller-production-boundary-interface.cjs'],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!pass);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed.\n`);
process.stdout.write('Phase 1825 regression audit follows the current receipt-only scanner contract; inventory authority is implemented, while production wiring and legacy subscanner retirement remain pending.\n');
process.exitCode = failures === 0 ? 0 : 1;
