const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const implementationPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const pipelinePath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const packagePath = path.join(root, 'package.json');
const implementation = fs.readFileSync(implementationPath, 'utf8');
const contract = fs.readFileSync(contractPath, 'utf8');
const pipeline = fs.readFileSync(pipelinePath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const checks = [
  ['implementation exists at scanner wiring boundary', fs.existsSync(implementationPath)],
  ['implementation conforms to existing LaravelControllerScannerInterface', /export const laravelControllerScanner:\s*LaravelControllerScannerInterface/.test(implementation)],
  ['implementation preserves closed contract version', /contractVersion:\s*26/.test(implementation) && /readonly contractVersion:\s*26/.test(contract)],
  ['source project is derived from the authority-closed receipt', /invocationInventoryReceipt\.sourceInventory\.sourceProject/.test(implementation)],
  ['whole-file integrated response and exact judgment stay correlated', /responseJudgmentFor\(invocationJudgment, declarationEvidence, responseSemanticPipeline\)/.test(implementation) && /judgment:\s*invocationJudgment,\s*responseJudgment/.test(implementation)],
  ['artifact forwards the exact source-correlated invocation judgment', /invocationJudgment,\s*responseJudgment,\s*projectionJudgment/.test(implementation) && /readonly invocationJudgment:\s*LaravelControllerInvocationOutcome/.test(contract)],
  ['controller AST and action contracts remain grouped per artifact', /ast:\s*produced\.ast/.test(implementation) && /actions:\s*sequenceToArray\(produced\.actions\)/.test(implementation) && /resourceBindings,/.test(implementation)],
  ['scan returns the existing closed judgment contract', /kind:\s*'laravel_controller_scan_judgment'/.test(implementation) && /controllers:\s*Object\.freeze\(result\.controllers\)/.test(implementation)],
  ['implementation does not call legacy ControllerScanner facade', !/\bControllerScanner\b|controllerIndex|scanCanonicalBundle/.test(implementation)],
  ['implementation avoids forbidden semantic foundation', !/semantic\/foundation/.test(implementation)],
  ['audit command is registered', packageJson.scripts?.['audit:phase1839-laravel-controller-scanner-interface-implementation'] === 'node scripts/audits/audit-phase1839-laravel-controller-scanner-interface-implementation.cjs'],
  ['controller, route, and resource production are cut over to their interface implementations', /laravelControllerScanner\.scan/.test(pipeline) && /laravelRouteScanner\.scan/.test(pipeline) && /laravelResourceScanner\.scan/.test(pipeline) && !/ControllerScanner\.scanCanonicalBundle|ResourceScanner\.scanCanonicalBundle/.test(pipeline)],
];
let failures = 0;
for (const [label, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!pass) failures += 1;
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures ? 1 : 0;
