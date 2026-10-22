const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/controller.ts');
const resourceContract = read('packages/core/src/types/upstream/controllerResourceBindingInterface.ts');
const authority = read('packages/core/src/types/upstream/controllerResourceBindingAuthority.ts');
const dataflow = read('packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts');
const canonical = read('packages/core/src/compiler/scanner/subscanners/controller/controllerAstCanonical.ts');
const actionContract = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const boundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const packageJson = JSON.parse(read('package.json'));
const controllerDir = 'packages/core/src/compiler/scanner/subscanners/controller';
const checks = [
  ['canonical ControllerResponse already owns present and absent response outcomes', /export type ControllerResponse = \{ readonly kind: 'response_present'; readonly response: ResponseReference \} \| \{ readonly kind: 'response_absent' \}/.test(contract)],
  ['resource-binding candidate reuses ControllerResponse directly', /ControllerModelOrigin, ControllerResponse/.test(resourceContract) && /readonly response: ControllerResponse/.test(resourceContract)],
  ['duplicate resource-binding response evidence union is removed', !/ControllerResourceBindingResponseEvidence/.test(resourceContract) && !/kind: 'present'; readonly response: ResponseReference/.test(resourceContract) ],
  ['resource-binding contract explicitly records canonical response ownership', /contractVersion: 5/.test(resourceContract) && /closed_model_origin_judgment_and_canonical_controller_response_are_correlated/.test(resourceContract) && /reuse_controller_response_without_duplicate_response_evidence_union/.test(resourceContract)],
  ['authority branches on canonical response discriminants', /case 'response_absent'/.test(authority) && /case 'response_present'/.test(authority) && /case 'absent'/.test(authority) && !/ControllerResourceResponseEvidence/.test(authority)],
  ['dataflow consumer forwards ControllerResponse without reclassification', /response: ControllerResponse/.test(dataflow) && /resourceBindingCandidate\(value, semanticIndex, response, modelClasses\)/.test(dataflow) && !/ControllerResourceResponseEvidence/.test(dataflow)],
  ['canonical controller AST passes its existing response judgment directly', /createControllerDataflowContract\([\s\S]*?\n\s+response,\n/.test(canonical) && !/ControllerResourceResponseEvidence/.test(canonical)],
  ['controller action resolver constructs the canonical response contract once for dataflow', /const resourceResponse: ControllerResponse/.test(actionContract) && /kind: 'response_present'/.test(actionContract) && /kind: 'response_absent'/.test(actionContract) && !/ControllerResourceResponseEvidence/.test(actionContract)],
  ['scanner public contracts advance together', (boundary.match(/readonly contractVersion: 26;/g) || []).length === 2 && (scanner.match(/contractVersion: 26,/g) || []).length === 2 && /readonly version: 109/.test(boundary) && /version: 109,/.test(boundary)],
  ['previously emptied controller files remain empty', fs.statSync(path.join(root, controllerDir, 'actionVariableTracker.ts')).size === 0 && fs.statSync(path.join(root, controllerDir, 'controllerErrorDetector.ts')).size === 0],
  ['no semantic/foundation dependency was introduced', !/semantic\/foundation/.test(resourceContract + authority + dataflow + canonical + actionContract)],
  ['audit is registered in package.json', packageJson.scripts['audit:phase1887-controller-resource-binding-reuses-canonical-response-interface-first'] === 'node scripts/audits/audit-phase1887-controller-resource-binding-reuses-canonical-response-interface-first.cjs'],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
