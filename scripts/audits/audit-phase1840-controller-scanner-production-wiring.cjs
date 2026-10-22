const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const pipelinePath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const implementationPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const packagePath = path.join(root, 'package.json');
const pipeline = fs.readFileSync(pipelinePath, 'utf8');
const implementation = fs.readFileSync(implementationPath, 'utf8');
const collections = fs.readFileSync(collectionsPath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const checks = [
  ['production pipeline imports the existing controller scanner implementation', /import \{ laravelControllerScanner \} from '\.\/laravelControllerScanner'/.test(pipeline)],
  ['production pipeline calls the interface implementation with closed inventory receipt', /laravelControllerScanner\.scan\(\{[\s\S]*?invocationInventory:\s*invocationInventoryReceipt/.test(pipeline)],
  ['controller ASTs are projected from correlated controller scan artifacts', /controllerScan\.controllers\.map\(artifact => artifact\.ast\)/.test(pipeline)],
  ['controller action contracts are projected from the same artifacts', /controllerScan\.controllers\.flatMap\(artifact => artifact\.actions\)/.test(pipeline)],
  ['SourceAsts retains the whole closed controller scan judgment', /readonly controllerScan:\s*import\('\.\/laravelControllerScannerInterface'\)\.LaravelControllerScanJudgment/.test(collections) && /controllerScan,/.test(pipeline)],
  ['artifact actions come from controllerProducer canonical flow contracts', /actions:\s*sequenceToArray\(produced\.actions\)/.test(implementation)],
  ['source-correlated invocation judgment is preserved without reconstruction', /invocationJudgment,/.test(implementation) && /integratedResponse:\s*judgment\.response/.test(implementation)],
  ['controller scanner does not call legacy ControllerScanner facade', !/\bControllerScanner\b|controllerIndex|scanCanonicalBundle/.test(implementation)],
  ['legacy controller bundle is retired from production pipeline after route/resource interface cutover', !/ControllerScanner\.scanCanonicalBundle|ControllerScanner\.extractResourceDataflow|RouteScanner\.scanCanonicalBundle|ResourceScanner\.scanCanonicalBundle/.test(pipeline) && /laravelRouteScanner\.scan\(/.test(pipeline) && /laravelResourceScanner\.scan\(/.test(pipeline)],
  ['no semantic foundation dependency was introduced', !/semantic\/foundation/.test(implementation) && !/semantic\/foundation/.test(pipeline)],
  ['audit command is registered', packageJson.scripts?.['audit:phase1840-controller-scanner-production-wiring'] === 'node scripts/audits/audit-phase1840-controller-scanner-production-wiring.cjs'],
];
let failures = 0;
for (const [label, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!pass) failures += 1;
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures ? 1 : 0;
