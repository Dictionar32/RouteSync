const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const resolver = read('packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts');
const tests = read('packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.phase921.test.ts');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const checks = [
  ['canonical scanner creates policy catalog from existing controller action contracts', () => scanner.includes('const controllerPolicyCatalog: readonly ControllerPolicyCatalogEntry[] = Object.freeze(actions.map(action') && scanner.includes('relations: Object.freeze(sequenceToArray(action.policy))')],
  ['canonical scanner passes the existing inheritedFrom judgment into policy resolution', () => scanner.includes('inheritedFrom: action.inheritedFrom')],
  ['canonical scanner passes the catalog into the existing policy resolver', () => scanner.includes('policyCatalog: controllerPolicyCatalog')],
  ['resolver uses supplied closed ancestry when no inheritance graph is passed', () => resolver.includes('const inheritedPolicyControllers = input.inheritance ? inherited : input.inheritedFrom ?? [];')],
  ['resolver collects policy evidence for inherited controllers', () => resolver.includes('const inheritedRelations = inheritedPolicyControllers.flatMap(controller => policyForController(controller, policyCatalog)')],
  ['policy catalog deduplicates repeated source evidence while retaining distinct middleware names from one source span', () => resolver.includes('samePolicySource') && resolver.includes('relations.findIndex(candidate => samePolicySource(candidate, relation)) === index') && resolver.includes('Object.is(left.middleware.value.value, right.middleware.value.value)')],
  ['inherited controller policy regression coverage exists', () => tests.includes('Phase 2336 inherited policy catalog closure') && tests.includes('uses the existing inheritedFrom identity')],
  ['repeated inherited source evidence regression coverage exists', () => tests.includes('does not duplicate inherited class policy repeated in several action catalog entries')],
  ['route scanner interface contract version is 12', () => contract.includes('readonly contractVersion: 12;')],
  ['scanner blocked and complete outcomes use contract version 12', () => scanner.includes("kind: 'laravel_route_scan_blocked', contractVersion: 12") && scanner.includes("kind: 'laravel_route_scan_judgment', contractVersion: 12")],
  ['no new parallel policy V2 contract was introduced', () => !/EffectiveControllerActionPolicyV2|RouteSemanticFlowV2|LaravelRouteScannerInterfaceV2/.test([resolver, scanner, contract].join('\n'))],
  ['effective policy implementation remains outside semantic relations/foundation', () => !/semantic\/(relations|foundation)/.test(resolver)],
];
const results = checks.map(([name, run]) => ({ name, passed: run() }));
for (const result of results) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
const failed = results.filter(result => !result.passed);
process.stdout.write(`${results.length - failed.length}/${results.length} checks passed\n`);
if (failed.length > 0) process.exitCode = 1;
