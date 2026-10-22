const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelRouteDeclarationMethodSemanticAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const tests = read('packages/core/src/types/upstream/__tests__/laravel-route-declaration-method-judgment.phase2350.test.ts');
const resourceAuthority = authority.slice(authority.indexOf('const resourceMethod'), authority.indexOf('const standardMethod'));
const resourceEmission = scanner.slice(scanner.indexOf("case 'laravel_route_declaration_method_resource':"), scanner.indexOf("case 'laravel_route_declaration_method_all_methods':"));
const checks = [
  ['resource judgment carries only its semantic method family', /kind: 'laravel_route_declaration_method_resource'; readonly method: LaravelResourceRouteMethod }/.test(contract)],
  ['all-method judgment carries no redundant target-method list', /kind: 'laravel_route_declaration_method_all_methods'; readonly method: 'any'; readonly httpMethods: readonly HttpMethod\[\] }/.test(contract)],
  ['match judgment retains explicit target-method evidence', /kind: 'laravel_route_declaration_method_match'; readonly method: 'match'; readonly targetMethods: readonly LaravelRouteTargetMethod\[\]/.test(contract)],
  ['standard judgment is closed to one resolved HTTP method and carries no irrelevant target evidence', /kind: 'laravel_route_declaration_method_standard'; readonly method: LaravelStandardRouteMethod; readonly httpMethods: readonly \[HttpMethod\]/.test(contract) && !/kind: 'laravel_route_declaration_method_standard';[^}]*targetMethods/.test(contract)],
  ['upstream authority emits minimal resource judgment', /const resourceMethod = \(method: LaravelResourceRouteMethod\)[\s\S]*?kind: 'laravel_route_declaration_method_resource', method/.test(resourceAuthority) && !/targetMethods/.test(resourceAuthority)],
  ['upstream authority emits minimal any-method judgment', /const allMethods = \(\)[\s\S]*kind: 'laravel_route_declaration_method_all_methods', method: 'any', httpMethods: allHttpMethods/.test(authority)],
  ['authority version matches the evolved judgment contract', /contractVersion: 8/.test(contract) && /contractVersion: 8/.test(authority)],
  ['scanner and route scan outcomes match contract version 26', (contract.match(/contractVersion: 26/g) || []).length >= 4 && /contractVersion: 26/.test(scanner)],
  ['resource emission does not read absent target-method evidence', /resourceRegistrationFromDeclaration/.test(resourceEmission) && !/methodJudgment\.targetMethods/.test(resourceEmission)],
  ['all-method emission uses the canonical supported-method set', /case 'laravel_route_declaration_method_all_methods':[\s\S]*?methodJudgment\.httpMethods/.test(scanner)],
  ['regression tests no longer expect redundant target-method lists on any/resource arms', /kind: 'laravel_route_declaration_method_all_methods',[\s\S]*?method: 'any',[\s\S]*?\}\)/.test(tests) && !/kind: 'laravel_route_declaration_method_all_methods',[\s\S]*?targetMethods: \['any'\]/.test(tests) && !/kind: 'laravel_route_declaration_method_resource',[\s\S]*?targetMethods: \['apiResource'\]/.test(tests)],
  ['canonical authority remains singular with no V2 duplicate', !/LaravelRouteDeclarationMethodJudgmentV2|LaravelRouteScannerV2/.test(contract + authority)],
  ['no semantic foundation dependency introduced', !/semantic\/foundation/.test(contract + authority + scanner)],
  ['remaining semantic relations dependency is documented rather than claimed removed', /does not yet eliminate the remaining `semantic\/relations` dependency/.test(read('packages/core/src/types/upstream/docs/PHASE2351-ROUTE-METHOD-JUDGMENT-CARRIES-TARGET-METHOD-EVIDENCE.md'))],
  ['source-AST pipeline attribute scanner wiring matches its existing interface version 20', /attributeScanner: Object\.freeze\(\{[\s\S]*?contractVersion: 20/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts')) && /interface LaravelAttributeScannerInterface[\s\S]*?contractVersion: 20/.test(read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts'))],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 2352 audit: ${checks.length - failed}/${checks.length} passed\n`);
assert.equal(failed, 0, 'Phase 2352 audit failed');
