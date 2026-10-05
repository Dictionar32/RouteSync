const fs = require('fs');
const path = require('path');

const root = process.cwd();
const files = [
  'packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts',
  'packages/core/src/compiler/scanner/subscanners/ControllerScanner.ts',
  'packages/core/src/compiler/scanner/subscanners/controller/actionScanner.ts',
  'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts',
];
const text = files.map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const remaining = [...text.matchAll(/\bmodelNames\b/g)].length;
const contract = fs.readFileSync(path.join(root, files[3]), 'utf8');
const contextHas = /modelNames/.test(contract);
const report = {
  phase: 888,
  audit: 'upstream-controller-model-names-plumbing',
  modelNamesReferencesInProductionRouteControllerPath: remaining,
  controllerActionContractContextHasModelNames: contextHas,
  classification: remaining === 0 && !contextHas ? 'PASS' : 'FAIL',
  deletedFiles: 0,
  timestamp: new Date().toISOString(),
};
console.log(JSON.stringify(report, null, 2));
if (report.classification !== 'PASS') process.exit(1);
