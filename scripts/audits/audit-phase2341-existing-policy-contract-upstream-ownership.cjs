const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const policy = read('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts');
const resolver = read('packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts');
const scannerInterface = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const regression = read('packages/core/src/types/upstream/__tests__/effective-route-action-policy.phase928.test.ts');
const checks = [
  ['catalog is owned by existing upstream policy contract', policy.includes('interface EffectiveControllerActionPolicyCatalogEntry')],
  ['catalog evidence is required by upstream input', /readonly policyCatalog: readonly EffectiveControllerActionPolicyCatalogEntry\[\]/.test(policy)],
  ['inherited policy is closed at upstream', resolver.includes('.filter(relation => relation.scope.kind === \'class\')')],
  ['upstream authority delegates to canonical resolver', resolver.includes('judge: resolveEffectiveControllerActionPolicyUpstream')],
  ['executor delegates to authority', resolver.includes('execute: input => effectiveControllerActionPolicySemanticAuthority.judge(input)')],
  ['authority and executor contracts versioned together', (policy.match(/readonly contractVersion: 3;/g) ?? []).length === 2],
  ['Laravel scanner contract requires executor', scannerInterface.includes('readonly effectiveControllerActionPolicyExecutor: EffectiveControllerActionPolicyRuntimeExecutorInterface')],
  ['Laravel scanner contract version advanced', scannerInterface.includes('readonly contractVersion: 14;')],
  ['scanner calls executor instead of scanner-local resolver', scanner.includes('effectiveControllerActionPolicyExecutor.execute({') && !scanner.includes('resolveEffectiveControllerActionPolicy({')],
  ['scanner passes catalog to executor', scanner.includes('policyCatalog: controllerPolicyCatalog')],
  ['regression test protects class-vs-method inheritance scope', regression.includes('inherits class policy but never leaks an ancestor method-only policy') && regression.includes("toEqual(['auth'])")],
  ['upstream resolver avoids foundation and relation imports', !resolver.includes('semantic/foundation') && !resolver.includes('semantic/relations')],
];
const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`Phase 2341 existing policy contract audit: ${checks.length - failed.length}/${checks.length} passed\n`);
process.exitCode = failed.length === 0 ? 0 : 1;
