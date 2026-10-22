const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const routeScanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const routeProducer = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const actionInterface = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2153-ACTION-JUDGMENT-PUBLICATION-CONTRACT-DESIGN.md');
const checks = [
  ['scanner judges each selected action through existing authority', /actionJudgment\.judge\(/.test(scanner)],
  ['executor forwards exact action judgment', /actionExecution\.execute\(\{[\s\S]*?semanticJudgment,/.test(scanner)],
  ['scanner currently publishes action projections', /actions:\s*produced\.actions/.test(scanner)],
  ['scanner artifact contract currently has no actionJudgments publication', /interface LaravelControllerScanArtifactBase/.test(scannerContract) && !/actionJudgments\s*:/.test(scannerContract)],
  ['route scanner currently flattens action projections only', /controllerScan\.controllers\.flatMap\(controller => controller\.actions\)/.test(routeScanner)],
  ['route boundary construction precedes binding judgment', /routeBoundaryContractFromRouteEmission\(route\)[\s\S]*?bindingAuthority\.judge/.test(routeScanner)],
  ['controller-reference boundary defaults to no_request', /origin:\s*'controller_reference'[\s\S]*?request:\s*\{\s*kind:\s*'no_request'/.test(routeProducer)],
  ['canonical request ADT already has five variants', /kind: 'no_request'/.test(read('packages/core/src/types/upstream/laravelControllerRequestSemanticBinding.ts')) && /kind: 'typed_unresolved'/.test(read('packages/core/src/types/upstream/laravelControllerRequestSemanticBinding.ts')) && /kind: 'framework_request'/.test(read('packages/core/src/types/upstream/laravelControllerRequestSemanticBinding.ts')) && /kind: 'form_request'/.test(read('packages/core/src/types/upstream/laravelControllerRequestSemanticBinding.ts')) && /kind: 'typed'/.test(read('packages/core/src/types/upstream/laravelControllerRequestSemanticBinding.ts'))],
  ['action judgment projection parameter is generic', /interface LaravelControllerActionSemanticJudgmentInterface\s*</.test(actionInterface)],
  ['design forbids casts and duplicate reduced judgment', /Do not hide this issue with `unknown`, a cast, or a second reduced/.test(docs)],
  ['typed request obligation remains open', /typed_request_binding_projection_loss/.test(docs)],
  ['no relation/foundation or subscanner added', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerRouteRequestSemanticAuthority.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/actionJudgmentRouteRequest.ts'))],
];
let failures = 0;
for (const [name, check] of checks) {
  let passed = false;
  try { passed = typeof check === 'function' ? check() : check; } catch { passed = false; }
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
