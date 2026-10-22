const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const resolver = read('packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts');
const tests = read('packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.phase921.test.ts');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const wiringResolver = read('packages/core/src/compiler/scanner/wiring/route/effectiveControllerActionPolicyResolver.ts');

assert.match(resolver, /flatMap\(controller => policyForController\(controller, policyCatalog\)\)\s*\.filter\(relation => relation\.scope\.kind === 'class'\)/);
assert.match(resolver, /Inheritance transfers class-level policy, not method-level policy declared/);
assert.match(tests, /Phase 2337 inherited policy scope closure/);
assert.match(tests, /does not leak an ancestor method-only policy into a child action/);
assert.match(tests, /toEqual\(\['auth'\]\)/);
assert.match(contract, /readonly contractVersion: 13;/);
assert.match(scanner, /contractVersion: 13/);
assert.match(wiringResolver, /resolveEffectiveControllerActionPolicy/);
assert.doesNotMatch(resolver, /semantic\/relations|semantic\/foundation/);
assert.doesNotMatch(resolver + contract + scanner, /EffectiveControllerActionPolicyV2|RouteSemanticFlowV2|LaravelRouteScannerInterfaceV2/);
assert.match(scanner, /inheritedFrom: action\.inheritedFrom/);
assert.match(scanner, /policyCatalog: controllerPolicyCatalog/);

console.log('Phase 2337 inherited policy scope closure: 11/11 static assertions passed');
