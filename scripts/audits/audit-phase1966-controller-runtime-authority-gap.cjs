const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['existing controller scanner interface is the current contract', () => read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts').includes('LaravelControllerInvocationSemanticBoundaryContract')],
  ['interface promises source-artifact collection only', () => read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts').includes('source-artifact-collection-only-no-semantic-judgment-construction')],
  ['runtime builds declaration name map', () => read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts').includes('declarationByName = new Map')],
  ['runtime computes inherited attributes recursively', () => read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts').includes('const inheritedAttributes =') && read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts').includes('return visit(controllerName, new Set<string>())')],
  ['runtime selects action methods', () => read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts').includes('const actionMethods = relationSelect')],
  ['runtime derives inherited controller names', () => read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts').includes('const inheritedControllerNames =')],
  ['controller producer receives exact invocation judgment', () => read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts').includes('controllerProducer.produce({ declaration: declarationEvidence, invocationJudgment })')],
  ['pipeline directly invokes concrete stage producers', () => ['scanMigrationAsts', 'ModelScanner.scanCanonicalBundle', 'FormRequestScanner.scanCanonicalBundle', 'scanResponseBundle', 'scanServiceBundle', 'scanMiddlewareAsts', 'scanDtoAsts', 'scanProviderBundle', 'ChannelScanner.scanCanonicalAsts'].every((name) => read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts').includes(name))],
  ['source AST pipeline still returns SourceAsts directly', () => read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts').includes('Promise<SourceAsts>')],
  ['pipeline preserves exact invocation inventory receipt', () => read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts').includes('controllerInvocationSemanticInventory: invocationInventoryReceipt')],
  ['no relation/foundation scanner directory exists', () => !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/foundation'))],
];
let failed = 0;
for (const [label, test] of checks) {
  const passed = test();
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
