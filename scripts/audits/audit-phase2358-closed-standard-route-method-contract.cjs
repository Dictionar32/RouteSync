const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelRouteDeclarationMethodSemanticAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const tests = read('packages/core/src/types/upstream/__tests__/laravel-route-declaration-method-judgment.phase2350.test.ts');
const checks = [
  ['existing judgment ADT remains the single method authority contract', /type LaravelRouteDeclarationMethodJudgment =/.test(contract) && !/LaravelRouteDeclarationMethodJudgmentV2/.test(contract)],
  ['standard judgment carries only its resolved method and one HTTP method', /kind: 'laravel_route_declaration_method_standard'; readonly method: LaravelStandardRouteMethod; readonly httpMethods: readonly \[HttpMethod\]/.test(contract) && !/kind: 'laravel_route_declaration_method_standard';[^}]*targetMethods/.test(contract)],
  ['standard authority no longer copies irrelevant parser target-method evidence', /const standardMethod = \(method: LaravelStandardRouteMethod\)/.test(authority) && !/const standardMethod = \(method: LaravelStandardRouteMethod, targetMethods/.test(authority)],
  ['query judgment has a single-method tuple rather than an unconstrained list', /kind: 'laravel_route_declaration_method_query'; readonly method: 'query'; readonly httpMethods: readonly \[HttpMethod\]/.test(contract)],
  ['match judgment retains explicit target-method evidence and resolved method set', /kind: 'laravel_route_declaration_method_match'; readonly method: 'match'; readonly targetMethods: readonly LaravelRouteTargetMethod\[\]; readonly httpMethods: readonly HttpMethod\[\]/.test(contract)],
  ['all-method judgment retains the canonical method set', /kind: 'laravel_route_declaration_method_all_methods'; readonly method: 'any'; readonly httpMethods: readonly HttpMethod\[\]/.test(contract)],
  ['resource judgment remains distinct and does not carry HTTP method guesses', /kind: 'laravel_route_declaration_method_resource'; readonly method: LaravelResourceRouteMethod/.test(contract)],
  ['authority version advances to 8 with the ADT change', /readonly contractVersion: 8/.test(contract) && /contractVersion: 8/.test(authority)],
  ['scanner and all scan outcomes use contract version 26', (contract.match(/contractVersion: 26/g) || []).length >= 4 && (scanner.match(/contractVersion: 26/g) || []).length >= 4],
  ['scanner emits the already-resolved HTTP method set', /emitStandardRoutes\(methodJudgment\.httpMethods/.test(scanner)],
  ['scanner does not inspect standard judgment targetMethods', !/methodJudgment\.targetMethods/.test(scanner)],
  ['regression expectations no longer require standard targetMethods', /kind: 'laravel_route_declaration_method_standard',[\s\\S]*?method: 'get',[\s\\S]*?httpMethods: \[HttpMethod\.GET\]/.test(tests) && !/kind: 'laravel_route_declaration_method_standard',[\s\\S]*?targetMethods: \['get'\]/.test(tests)],
  ['upstream method mapping remains a total typed record', /targetMethodHttpVocabulary: Readonly<Record<LaravelRouteTargetMethod, HttpMethodValue>>/.test(authority)],
  ['active route method judgment introduces no semantic foundation dependency', !/semantic\/foundation/.test(contract + authority + scanner)],
  ['upstream judgment contract introduces no semantic relations dependency', !/semantic\/relations/.test(contract + authority)],
  ['active source-AST pipeline still injects the same route scanner contract', /routeScanner: laravelRouteScanner/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'))],
  ['CLI manifest builder still executes the source-AST pipeline', /laravelSourceAstPipeline\.execute\(pipelineInput\)/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts'))],
  ['CLI scan still delegates through invocation composition', /buildManifestWithInvocationPipeline/.test(read('packages/cli/src/commands/scan.ts'))],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 2358 audit: ${checks.length - failed}/${checks.length} passed\n`);
assert.equal(failed, 0, 'Phase 2358 audit failed');
