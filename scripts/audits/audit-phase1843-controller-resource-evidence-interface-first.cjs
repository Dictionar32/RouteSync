const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const implementation = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const resourceInterface = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const semantic = read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['controller scan contract version advances for the new artifact member', /readonly contractVersion: 10/.test(contract) && /contractVersion: 10/.test(implementation)],
  ['controller artifact carries source-correlated resource binding evidence', /readonly resourceBindings: readonly ControllerResourceBindingEvidence\[\]/.test(contract)],
  ['resource evidence preserves controller and action identity', /readonly controller: ControllerName/.test(contract) && /readonly action: ActionName/.test(contract)],
  ['resource evidence preserves resource and source-derived model origin', /readonly resource: ResourceReference/.test(contract) && /readonly modelOrigin: ControllerModelOrigin/.test(contract)],
  ['resource evidence preserves response and source span', /readonly response: ResponseReference/.test(contract) && /readonly source: SourceSpan/.test(contract)],
  ['production controller scanner projects resource facts from the parsed action contract', /descriptor\.dataflow\.resourceBindings/.test(implementation)],
  ['resource evidence remains in the same artifact as exact invocation judgment', /resourceBindings,[\s\S]*?invocationJudgment,/.test(implementation)],
  ['resource model-binding authority receives the complete controller judgment', /readonly controllerScan: LaravelControllerScanJudgment/.test(semantic) && /readonly controllerScan: LaravelControllerScanJudgment/.test(resourceInterface)],
  ['controller resource evidence is consumed through the integrated resource scanner interface', /laravelResourceScanner\.scan/.test(pipeline) && !/ResourceScanner\.scanCanonicalBundle/.test(pipeline)],
  ['no semantic foundation dependency is introduced', !/semantic\/foundation/.test(contract + implementation + resourceInterface + semantic)],
  ['audit command is registered', packageJson.scripts?.['audit:phase1843-controller-resource-evidence-interface-first'] === 'node scripts/audits/audit-phase1843-controller-resource-evidence-interface-first.cjs'],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const passed = checks.filter(([, value]) => value).length;
console.log(`${passed}/${checks.length} checks passed`);
if (passed !== checks.length) process.exitCode = 1;
