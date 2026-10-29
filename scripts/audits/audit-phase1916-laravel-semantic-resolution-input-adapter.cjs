const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const adapter = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticResolutionInputAdapter.ts');
const iface = read('packages/core/src/types/upstream/controllerVariableSemanticResolutionInputAdapterInterface.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['upstream interface defines canonical request adapter', iface.includes('ControllerVariableSemanticResolutionInputAdapterInterface') && iface.includes('ControllerVariableSemanticResolutionRequest')],
  ['contract explicitly excludes semantic rule selection', iface.includes('semantic-rule-selection-resolution-and-judgment-closure-remain-owned-by-controller-variable-semantic-authority')],
  ['PHP adapter performs syntax evidence translation', adapter.includes('controllerVariableSemanticEvidenceFromPhpAst(input.expression)')],
  ['PHP adapter builds typed parameter bindings', adapter.includes('parameterBindings: Object.freeze(input.parameterSemantics.map')],
  ['analyzer delegates request adaptation through interface', analyzer.includes('semanticResolutionInputAdapter.adapt({')],
  ['analyzer no longer maps AST evidence or parameter bindings inline', !analyzer.includes('controllerVariableSemanticEvidenceFromPhpAst') && !analyzer.includes('parameterSemantics.map(')],
  ['existing upstream semantic executor remains sole resolver', analyzer.includes('executor.execute(semanticResolutionInputAdapter.adapt(') && !adapter.includes('controllerVariableSemanticAuthority')],
  ['composition root injects the PHP adapter', wiring.includes('phpControllerVariableSemanticResolutionInputAdapter')],
  ['canonical invocation judgment and integrated response remain retained', analyzer.includes('invocationSemanticIntegratedResponse') && analyzer.includes('invocationJudgment: judgment')],
  ['scanner boundary contract version 82 records adapter ownership', scannerContract.includes('version: 82') && scannerContract.includes('controllerDataflowSemanticResolutionInputAdapterBoundary')],
  ['upstream barrel exports adapter interface', barrel.includes("export * from './controllerVariableSemanticResolutionInputAdapterInterface';")],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
