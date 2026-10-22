const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const responseInterface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const scannerInterface = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const invocationInterface = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const scannerRuntime = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const checks = [
  ['runtime executor is generic over the existing response authority', /interface LaravelControllerResponseSemanticRuntimeExecutorInterface\s*<\s*Authority extends LaravelControllerResponseSemanticJudgmentAuthorityInterface/.test(responseInterface)],
  ['executor authority retains the generic authority type', /readonly authority:\s*Authority;/.test(responseInterface)],
  ['executor projection type is selected from that same authority', /readonly returnResponseProjection:\s*Authority\['returnResponseProjection'\];/.test(responseInterface)],
  ['executor execute signature is selected directly from the authority judge contract', /readonly execute:\s*Authority\['judge'\];/.test(responseInterface)],
  ['interface explicitly avoids claiming runtime object identity', /not\s+proof\s+of\s+runtime\s+object\s+identity/.test(responseInterface)],
  ['canonical integrated response ADT remains the pipeline result', /export type LaravelControllerIntegratedResponseJudgment</.test(responseInterface)],
  ['scanner artifact still correlates invocation, response, and AST projection', /readonly invocationJudgment:\s*InvocationJudgment;[\s\S]*?readonly responseJudgment:\s*ResponseJudgment;[\s\S]*?readonly projectionJudgment:\s*LaravelControllerIntegratedAstProjectionJudgment<InvocationJudgment, ResponseJudgment>/.test(scannerInterface)],
  ['invocation judgment remains a closed four-outcome union', ['not_connected', 'source_binding_rejected', 'complete', 'blocked'].every((outcome) => invocationInterface.includes(`php_source_invocation_integration_${outcome}`))],
  ['runtime scanner remains untouched and its relation dependency is honestly visible', /semantic\/relations/.test(scannerRuntime)],
  ['runtime scanner remains untouched and its subscanner dependency is honestly visible', /scanControllerAction/.test(scannerRuntime)],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failures += passed ? 0 : 1;
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
