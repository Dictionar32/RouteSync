const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelRouteDeclarationMethodSemanticAuthority.ts');
const routeProjection = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const test = read('packages/core/src/types/upstream/__tests__/laravel-route-declaration-method-judgment.phase2350.test.ts');
const checks = [
  ['existing route method judgment ADT distinguishes resource methods', /laravel_route_declaration_method_resource/.test(contract)],
  ['existing route method judgment ADT distinguishes any-method declarations', /laravel_route_declaration_method_all_methods/.test(contract)],
  ['existing route method judgment ADT distinguishes match declarations', /laravel_route_declaration_method_match/.test(contract)],
  ['standard method arm excludes any, match, and resource variants', /Exclude<LaravelRouteMethod, LaravelResourceRouteMethod \| 'match' \| 'any'>/.test(contract)],
  ['existing method authority contract is explicitly versioned', /contractVersion: 8/.test(contract) && /contractVersion: 8/.test(authority)],
  ['upstream authority judges any-method declarations into the closed arm', /case 'any':[\s\S]*return allMethods\(\)/.test(authority)],
  ['upstream authority judges match declarations into the closed arm', /case 'match':[\s\S]*return matchMethods\(targetMethods\)/.test(authority)],
  ['route producer projection consumes the existing method judgment', /methodJudgment: LaravelRouteDeclarationMethodJudgment/.test(routeProjection) && /routeMethodKind\[methodJudgment\.kind\]\(\)/.test(routeProjection)],
  ['route projection no longer reclassifies declarations through routeMethodSemanticKind', !/routeMethodSemanticKind/.test(routeProjection)],
  ['HTTP method projection is a total typed record rather than a fallback lookup', /Readonly<Record<HttpMethod, Exclude<RouteMethod, \{ readonly kind: 'match' \}>>>/.test(routeProjection)],
  ['HTTP method projection contains no GET fallback branch', !/const toRouteMethod[\s\S]{0,180}kind: 'get'/.test(routeProjection)],
  ['scanner carries the same method judgment from authority to route producer', /const methodJudgment = methodAuthority\.judge\(\{ method: declaration\.method, targetMethods: declaration\.targetMethods \}\)/.test(scanner) && /routeProducerInputFromRouteBoundary\(boundary, declaration, sourceSpan, methodJudgment/.test(scanner)],
  ['route scanner interface and scan judgments are advanced to contract version 26', (contract.match(/contractVersion: 26/g) || []).length >= 4 && /contractVersion: 26/.test(scanner)],
  ['regression test covers any, match, standard, and resource variants', ['any', 'match', 'get', 'apiResource'].every(method => test.includes(`method: '${method}'`))],
  ['no semantic foundation dependency introduced in changed path', !/semantic\/foundation/.test(contract + authority + routeProjection + scanner)],
  ['no duplicate V2 route-method contract introduced', !/LaravelRouteDeclarationMethodJudgmentV2|RouteMethodJudgmentV2/.test(contract + authority + routeProjection + scanner)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 2350 audit: ${checks.length - failed}/${checks.length} passed\n`);
assert.equal(failed, 0, 'Phase 2350 audit failed');
