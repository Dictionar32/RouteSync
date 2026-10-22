const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['existing upstream input uses a closed catalog judgment ADT', () => /type EffectiveControllerActionPolicyCatalogJudgment\s*=\s*[\s\S]*kind: 'complete'[\s\S]*kind: 'blocked'/.test(read('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts'))],
  ['catalog blocked reason is domain-typed with controller lineage', () => /kind: 'controller_policy_inventory_unavailable'[\s\S]*controllers: readonly ControllerName\[\]/.test(read('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts'))],
  ['old raw-array catalog contract is absent from upstream input', () => !/readonly policyCatalog: readonly EffectiveControllerActionPolicyCatalogEntry\[\]/.test(read('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts'))],
  ['resolver blocks when inherited controller is absent from complete catalog', () => /missingInheritedControllers[\s\S]*catalog\.entries[\s\S]*controller_policy_inventory_unavailable/.test(read('packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts'))],
  ['blocked result has no partial middleware or authorization products', () => /case 'blocked':[\s\S]*return Object\.freeze\(\{ \.\.\.identity, judgment \}\)/.test(read('packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts'))],
  ['scanner supplies catalog completeness judgment to existing executor', () => /policyCatalog: \{ kind: 'complete', entries: controllerPolicyCatalog \}/.test(read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts'))],
  ['source-model policy resolver uses the canonical controller catalog', () => /effectiveControllerActionPolicyCatalogFromSourceModel\(catalog\)/.test(read('packages/core/src/types/upstream/highLevelSourceModel.ts'))],
  ['source-model catalog includes each controller policy inventory', () => /controller: controller\.identity\.name,[\s\S]*relations: Object\.freeze\(sequenceToArray\(controller\.action\.policy\)\)/.test(read('packages/core/src/types/upstream/highLevelSourceModel.ts'))],
  ['authority and executor contract versions match version 4', () => {
    const contract = read('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts');
    const runtime = read('packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts');
    return (contract.match(/readonly contractVersion: 4;/g) || []).length === 2 && (runtime.match(/contractVersion: 4,/g) || []).length === 2;
  }],
  ['Laravel route scanner contract version matches version 15', () => {
    const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
    const runtime = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
    return (contract.match(/readonly contractVersion: 15;/g) || []).length === 3 && (runtime.match(/contractVersion: 15,/g) || []).length === 3;
  }],
  ['regression test covers missing inherited controller inventory', () => /blocks inherited policy when the complete catalog omits an ancestor controller/.test(read('packages/core/src/types/upstream/__tests__/effective-route-action-policy.phase928.test.ts'))],
  ['new/changed path does not import semantic foundation', () => {
    const files = [
      'packages/core/src/types/upstream/effectiveControllerActionPolicy.ts',
      'packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts',
      'packages/core/src/types/upstream/highLevelSourceModel.ts',
      'packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts',
    ];
    return files.every(file => !/semantic\/foundation/.test(read(file)));
  }],
];
let failures = 0;
for (const [name, check] of checks) {
  const passed = check();
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length} PASS\n`);
process.exitCode = failures === 0 ? 0 : 1;
