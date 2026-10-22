const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts');
const resolver = read('packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const routeScanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const tests = read('packages/core/src/types/upstream/__tests__/effective-route-action-policy.phase928.test.ts');
const checks = [
  ['blocked catalog retains known entries alongside unavailable controller identities', () => /kind: 'blocked'; readonly entries: readonly EffectiveControllerActionPolicyCatalogEntry\[\]; readonly reason/.test(contract)],
  ['resolver scopes unavailable inventory to the actual inherited lineage', () => /missingInheritedControllers[\s\S]*unavailable\.some\(candidate => sameController\(candidate, controller\)\)/.test(resolver)],
  ['known inherited entries remain usable when unrelated inventory is blocked', () => /const inheritedPolicy = missingControllers\.length === 0/.test(resolver)],
  ['controller scan artifact carries canonical identity even without actions', () => /kind: 'laravel_controller_scan_artifact';[\s\S]*identity: ControllerName;[\s\S]*actions: readonly ControllerActionFlowContract\[\]/.test(scannerContract)],
  ['controller scanner publishes identity from the declaration name', () => /kind: 'laravel_controller_scan_artifact' as const,[\s\S]*identity: createControllerName\(controllerName\)/.test(scanner)],
  ['controller scanner contract version is consistently 43', () => (scannerContract.match(/contractVersion: 43;/g) || []).length === 3 && (scanner.match(/contractVersion: 43 as const/g) || []).length === 3],
  ['route scanner catalog includes controllers with no published actions as unavailable', () => /controllerScan\.controllers\.filter\(controller => controller\.actions\.length === 0\)\.map\(controller => controller\.identity\)/.test(routeScanner)],
  ['route scanner retains known catalog entries in blocked catalog judgment', () => /kind: 'blocked' as const, entries, reason: Object\.freeze/.test(routeScanner)],
  ['route scanner injects existing policy executor and forwards catalog judgment', () => /effectiveControllerActionPolicyExecutor\.execute\([\s\S]*policyCatalog: controllerPolicyCatalog/.test(routeScanner)],
  ['regression test covers unrelated unavailable controller without blocking known ancestor', () => /uses known ancestor policy when an unrelated controller inventory is unavailable/.test(tests)],
  ['regression test still covers absent ancestor in a complete inventory', () => /blocks inherited policy when the complete catalog omits an ancestor controller/.test(tests)],
  ['new/changed authority paths do not import semantic foundation', () => [
    'packages/core/src/types/upstream/effectiveControllerActionPolicy.ts',
    'packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts',
    'packages/core/src/types/upstream/laravelControllerScannerInterface.ts',
    'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts',
    'packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts',
  ].every(file => !/semantic\/foundation/.test(read(file)))],
];
let failures = 0;
for (const [name, check] of checks) {
  const passed = check();
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length} PASS\n`);
process.exitCode = failures === 0 ? 0 : 1;
