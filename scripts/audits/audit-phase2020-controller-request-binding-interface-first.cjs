const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const retirement = read('packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const actionScanner = read('packages/core/src/compiler/scanner/operations/controller/actionScanner.ts');
const actionContract = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const actionTypes = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionTypes.ts');
const requestType = /export type ControllerRequestBinding =([\s\S]*?)\n\/\*\*/.exec(actionContract)?.[1] ?? '';
const controllerSubscannerDirectory = path.join(root, 'packages/core/src/compiler/scanner/operations/controller');
const remainingRelationConsumers = fs.readdirSync(controllerSubscannerDirectory)
  .filter(name => name.endsWith('.ts') && name !== 'actionScanner.ts')
  .filter(name => /semantic\/relations|semantic\/foundation/.test(fs.readFileSync(path.join(controllerSubscannerDirectory, name), 'utf8')))
  .sort();
const packageJson = JSON.parse(read('package.json'));
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });
check('existing retirement interface evolves before runtime wiring', /readonly version: 14/.test(retirement) && /actionRequestBindingRule/.test(retirement));
check('typed responsibility map binds source and target request ADTs', /'action-request-binding-forwarding': Readonly<[\s\S]*?ControllerActionContract\['request'\][\s\S]*?ControllerActionInfo\['request'\]/.test(retirement));
check('retirement responsibility records forwarding instead of scanner semantic classification', /kind: 'action-request-binding-forwarding'[\s\S]*?semanticDecisionInScanner: false/.test(retirement));
check('source contract aliases the existing closed request ADT and artifact preserves that ADT', /export type RequestContract = ControllerRequestBinding/.test(actionContract) && /readonly request: ControllerRequestBinding/.test(actionTypes));
check('request-binding ADT retains typed, form-request, framework-request, and no-request outcomes', /kind: 'typed'/.test(requestType) && /kind: 'form_request'/.test(requestType) && /kind: 'framework_request'/.test(requestType) && /kind: 'no_request'/.test(requestType));
check('action scanner forwards the closed request ADT unchanged', /request: contract\.request/.test(actionScanner));
check('action scanner no longer imports relation/foundation runtime helpers', !/semantic\/relations|semantic\/foundation|relationGate|relationEqual/.test(actionScanner));
check('action scanner reuses existing resolver-context types instead of duplicating tuple types', /ControllerActionContractResolverContext\['formRequestIndex'\]/.test(actionScanner) && /NonNullable<ControllerActionContractResolverContext\['customContextualAttributeNames'\]>/.test(actionScanner));
check('no relation/foundation subscanner directories exist', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation')));
check('no replacement controller subscanner or parallel authority was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/controllerActionRequestBindingScanner.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/controllerActionRequestBindingAuthority.ts')));
check('package audit entry and phase source are registered', packageJson.scripts['audit:phase2020-controller-request-binding-interface-first'] === 'node scripts/audits/audit-phase2020-controller-request-binding-interface-first.cjs');
const passed = checks.filter(item => item.passed).length;
const result = { phase: 2020, audit: 'controller-request-binding-interface-first', passed, total: checks.length, checks, removedRelationConsumers: ['packages/core/src/compiler/scanner/operations/controller/actionScanner.ts'], remainingControllerRelationConsumers: remainingRelationConsumers, note: 'This phase removes semantic/relations runtime helpers from actionScanner.ts only. Other controller subscanner and descriptor imports remain and are not claimed retired. Full project typecheck/build is not asserted.' };
fs.writeFileSync(path.join(root, 'PHASE2020_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
process.stdout.write(`\n${passed}/${checks.length} checks passed\n`);
if (passed !== checks.length) process.exitCode = 1;
