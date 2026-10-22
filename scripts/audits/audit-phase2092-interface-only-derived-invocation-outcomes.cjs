const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const scannerInterface = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const invocationInterface = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const responseInterface = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const scannerRuntime = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const checks = [
  ['scanner artifact outcome set derives from canonical invocation response discriminants', /LaravelControllerInvocationSemanticJudgmentInterface\['response'\]\['kind'\]/.test(scannerInterface)],
  ['mapped artifact outcome uses a distributive conditional type', /Kind extends LaravelControllerInvocationSemanticJudgmentInterface\['response'\]\['kind'\]\s*\?\s*LaravelControllerScanArtifactForOutcome<Kind>\s*:\s*never/.test(scannerInterface)],
  ['public scanner artifact aliases the derived outcome union rather than a duplicated literal list', /export type LaravelControllerScanArtifact = LaravelControllerScanArtifactForEveryOutcome;/.test(scannerInterface) && !/export type LaravelControllerScanArtifact =\s*\n\s*\| LaravelControllerScanArtifactForOutcome<'php_source_invocation_integration_not_connected'>/.test(scannerInterface)],
  ['canonical invocation judgment still declares not-connected outcome', invocationInterface.includes('php_source_invocation_integration_not_connected')],
  ['canonical invocation judgment still declares source-binding-rejected outcome', invocationInterface.includes('php_source_invocation_integration_source_binding_rejected')],
  ['canonical invocation judgment still declares blocked outcome', invocationInterface.includes('php_source_invocation_integration_blocked')],
  ['canonical invocation judgment still declares complete outcome', invocationInterface.includes('php_source_invocation_integration_complete')],
  ['response judgment remains indexed by the exact invocation judgment', /LaravelControllerIntegratedResponseJudgment<\s*InvocationJudgment/.test(responseInterface)],
  ['scan artifact keeps invocation-response-AST projection correlation', /readonly invocationJudgment:\s*InvocationJudgment;[\s\S]*?readonly responseJudgment:\s*ResponseJudgment;[\s\S]*?readonly projectionJudgment:\s*LaravelControllerIntegratedAstProjectionJudgment<InvocationJudgment, ResponseJudgment>/.test(scannerInterface)],
  ['runtime scanner is unchanged and unresolved relation/subscanner dependencies remain visible', /semantic\/relations/.test(scannerRuntime) && /scanControllerAction/.test(scannerRuntime)],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failures += passed ? 0 : 1;
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
