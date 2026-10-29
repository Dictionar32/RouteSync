'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const scanner = path.join(core, 'compiler/scanner');
const operationFile = path.join(scanner, 'descriptors/request/controllerActionTypes.ts');
const descriptorFile = path.join(scanner, 'descriptors/request/controllerActionDescriptor.ts');
const compositionFile = path.join(scanner, 'upstream/routeDeclarationComposition.ts');
const testFile = path.join(scanner, 'descriptors/request/controllerActionTypeOperations.phase2744.test.ts');
const read = p => fs.readFileSync(p, 'utf8');
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name); return e.isDirectory() ? walk(p) : [p];
  });
}
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });
const op = read(operationFile), descriptor = read(descriptorFile), composition = read(compositionFile), test = read(testFile);
check('route handler is no longer an exported free function', !/\bexport\s+(?:async\s+)?function\s+buildRouteHandler\b/.test(op), 'buildRouteHandlerImplementation is internal');
check('route handler implementation remains internal and explicit', /function\s+buildRouteHandlerImplementation\s*\(/.test(op), 'internal implementation present');
check('operation interface has explicit parameter and output types', /export interface ControllerActionTypeOperationsInterface/.test(op) && /readonly buildRouteHandler:\s*\(\s*controllerName: ControllerName,\s*actionName: ActionName,\s*\) => RouteHandlerDescriptor/s.test(op), 'ControllerName + ActionName -> RouteHandlerDescriptor');
check('public operation object is interface-typed and frozen', /export const controllerActionTypeOperations:\s*ControllerActionTypeOperationsInterface\s*=\s*Object\.freeze\(/.test(op), 'interface-first Object.freeze');
check('controller action descriptor uses operation object', /controllerActionTypeOperations\.buildRouteHandler\(/.test(descriptor) && !/(?<!controllerActionTypeOperations\.)\bbuildRouteHandler\(/.test(descriptor), 'both descriptor construction paths migrated');
check('upstream route composition uses operation object', /controllerActionTypeOperations\.buildRouteHandler\(/.test(composition) && !/import\s*\{\s*buildRouteHandler\s*\}/.test(composition), 'route declaration composition migrated');
check('local relation imports erased from controller action type runtime', !/semantic\/relations|relationGate|relationEqual/.test(op), 'direct discriminant branch; no relation combinator dependency');
check('invokable and named-action ADT branches covered by tests', /RouteHandlerKind\.InvokableController/.test(test) && /RouteHandlerKind\.ControllerAction/.test(test), 'both runtime branches covered');
check('legacy subscanners directory remains absent', !fs.existsSync(path.join(scanner, 'subscanners')), 'no subscanners directory');
for (const dir of ['semantic/relations','semantic/foundation']) {
  const p = path.join(core, dir);
  check(dir+' remains empty', fs.existsSync(p) && walk(p).length === 0, fs.existsSync(p) ? `${walk(p).length} files` : 'directory missing');
}
const cliScan = read(path.join(root, 'packages/cli/src/commands/scan.ts'));
const cliSync = read(path.join(root, 'packages/cli/src/commands/sync.ts'));
check('CLI scan retains shared manifest scan operation', /manifestScanOperation\.scan\(/.test(cliScan), 'CLI scan -> manifest scan operation');
check('CLI sync retains shared manifest scan operation', /manifestScanOperation\.scan\(/.test(cliSync), 'CLI sync -> manifest scan operation');
check('manifest complete/blocked ADTs remain represented', /manifest_builder_complete/.test(read(path.join(core, 'types/upstream/manifestBuilderInterface.ts'))) && /manifest_builder_blocked/.test(read(path.join(core, 'types/upstream/manifestBuilderInterface.ts'))), 'manifest builder complete | blocked');
const report = { phase: 2744, title: 'Controller action type runtime operation and relation-call-site reduction', passed: checks.every(x => x.passed), checksPassed: checks.filter(x => x.passed).length, checksTotal: checks.length, checks };
const reportPath = path.join(root, 'reports/PHASE2744_CONTROLLER_ACTION_TYPE_RUNTIME_OPERATION_AUDIT.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
