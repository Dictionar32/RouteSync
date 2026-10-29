const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const controllerTypes = read('packages/core/src/types/upstream/controller.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const contract = read('packages/core/src/compiler/scanner/operations/controller/controllerDataflowContract.ts');
const resourceAuthority = read('packages/core/src/types/upstream/controllerResourceBindingAuthority.ts');
const semanticInterface = read('packages/core/src/types/upstream/controllerVariableSemanticInterface.ts');
const scannerBoundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scannerImplementation = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const packageJson = JSON.parse(read('package.json'));
const controllerDir = 'packages/core/src/compiler/scanner/operations/controller';
const checks = [
  ['ControllerVariableDefinition has one semantic owner: the closed judgment', /interface ControllerVariableDefinition[\s\S]*readonly semanticResolution: ControllerVariableSemanticJudgment/.test(controllerTypes) && !/interface ControllerVariableDefinition[\s\S]*readonly semantic: ControllerVariableSemantic;/.test(controllerTypes)],
  ['legacy semantic sidecar projection is removed from the analyzer', !/semanticProjection/.test(analyzer) && !/semantic: semanticProjection/.test(analyzer)],
  ['canonical definition publishes only semanticResolution', /semanticResolution,/.test(analyzer) && !/semantic:\s*semanticResolution/.test(analyzer)],
  ['consumer lookup returns the upstream judgment instead of a weaker semantic projection', /lookupControllerSemanticJudgment/.test(contract) && /Lookup<ControllerVariableSemanticJudgment>/.test(contract) && !/lookupControllerSemantic\(/.test(contract)],
  ['latest definition selection preserves the full judgment', /definition\.semanticResolution/.test(contract) && !/definition\.semantic\b/.test(contract)],
  ['model-origin interpretation is owned by the upstream resource binding authority', /judgeModelOrigin/.test(resourceAuthority) && /evidence\.judgment\.semantic\.kind/.test(resourceAuthority) && !/function resolveModelOrigin\(/.test(contract)],
  ['semantic judgment union remains upstream-exported', /export \* from '\.\/controllerVariableSemanticInterface'/.test(barrel) && /ControllerVariableSemanticJudgment/.test(semanticInterface)],
  ['no duplicate ControllerVariableDefinition semantic field remains in scanner consumers', !/definition\.semantic\b/.test(analyzer + contract)],
  ['previously emptied controller files remain empty', fs.statSync(path.join(root, controllerDir, 'actionVariableTracker.ts')).size === 0 && fs.statSync(path.join(root, controllerDir, 'controllerErrorDetector.ts')).size === 0],
  ['no semantic/foundation dependency was introduced', !/semantic\/foundation/.test(controllerTypes + analyzer + contract)],
  ['Phase 1884 audit is registered in package.json', packageJson.scripts['audit:phase1884-laravel-controller-variable-judgment-only-consumer-interface-first'] === 'node scripts/audits/audit-phase1884-laravel-controller-variable-judgment-only-consumer-interface-first.cjs'],
  ['scanner public contract and implementation remain aligned at the current interface version', (scannerBoundary.match(/readonly contractVersion: 15;/g) || []).length === 2 && (scannerImplementation.match(/contractVersion: 15,/g) || []).length === 2],
  ['scanner ownership boundary remains aligned with the current version', /readonly version: 65/.test(scannerBoundary) && /version: 65,/.test(scannerBoundary)],
  ['no untracked duplicate projection authority is present', !exists('packages/core/src/types/upstream/controllerVariableSemanticValueProjectionInterface.ts') && !exists('packages/core/src/types/upstream/controllerVariableSemanticValueProjectionAuthority.ts')],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
