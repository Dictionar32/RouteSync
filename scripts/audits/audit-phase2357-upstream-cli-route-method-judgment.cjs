const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelRouteDeclarationMethodSemanticAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const producerRelations = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const cliComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const tests = read('packages/core/src/types/upstream/__tests__/laravel-route-declaration-method-judgment.phase2350.test.ts');
const docs = read('packages/core/src/types/upstream/docs/PHASE2357-UPSTREAM-CLI-ROUTE-METHOD-JUDGMENT.md');
const checks = [
  ['existing upstream judgment contract owns the final HTTP method vocabulary', /readonly httpMethods: readonly HttpMethod\[\]/.test(contract)],
  ['all-method judgment carries its resolved HTTP method set', /kind: 'laravel_route_declaration_method_all_methods'; readonly method: 'any'; readonly httpMethods/.test(contract)],
  ['match judgment carries source target evidence and resolved HTTP methods', /kind: 'laravel_route_declaration_method_match';[\s\S]*?targetMethods:[\s\S]*?httpMethods:/.test(contract)],
  ['standard judgment carries its resolved HTTP method', /kind: 'laravel_route_declaration_method_standard';[\s\S]*?httpMethods:/.test(contract)],
  ['QUERY judgment carries the canonical QUERY method', /kind: 'laravel_route_declaration_method_query'; readonly method: 'query'; readonly httpMethods/.test(contract) && /queryMethod = \(\)[\s\S]*?HttpMethod\.QUERY/.test(authority)],
  ['authority owns the closed target-method-to-HTTP-method projection', /targetMethodHttpVocabulary: Readonly<Record<LaravelRouteTargetMethod, HttpMethodValue>>/.test(authority)],
  ['authority expands any using the canonical HTTP method vocabulary', /allHttpMethods: readonly HttpMethodValue\[\][\s\S]*HttpMethod\.QUERY/.test(authority)],
  ['authority contract version advances with the judgment ADT', /contractVersion: 8/.test(contract) && /contractVersion: 8/.test(authority)],
  ['route scanner contract and scan outcomes advance together', /readonly contractVersion: 26/.test(contract) && (contract.match(/contractVersion: 26/g) || []).length >= 4 && /contractVersion: 26/.test(scanner)],
  ['route scanner emits the judgment method set without reclassifying target names', /emitStandardRoutes\(methodJudgment\.httpMethods/.test(scanner) && !/resolveHttpMethod|targetMethods\(methodJudgment\.targetMethods\)/.test(scanner)],
  ['route producer projection consumes the same upstream HTTP method judgment', /methodJudgment\.httpMethods/.test(producerRelations) && !/resolveRouteHttpMethod|ROUTE_HTTP_METHODS/.test(producerRelations)],
  ['route AST projection uses emitted typed method rather than parsing identity text', /toRouteMethod\(route\.method\)/.test(producerRelations) && !/resolveRouteHttpMethod\(route\.identity\.coordinates\.method\)/.test(producerRelations)],
  ['regression test proves any, match, query, and standard method sets', /httpMethods: \[HttpMethod\.GET, HttpMethod\.POST, HttpMethod\.PUT/.test(tests) && /httpMethods: \[HttpMethod\.QUERY\]/.test(tests)],
  ['CLI scan delegates to the shared invocation composition boundary', /buildManifestWithInvocationPipeline\(sourceProject/.test(cliScan)],
  ['composition boundary sends validated receipt and explicit route selection to manifest builder', /manifestBuilder\.build\(Object\.freeze\(\{ kind: 'manifest_builder_input',[\s\S]*?routeSelection \}\)\)/.test(cliComposition)],
  ['manifest builder executes the source-AST pipeline', /laravelSourceAstPipeline\.execute\(pipelineInput\)/.test(manifestBuilder)],
  ['source-AST pipeline injects the canonical Laravel route scanner', /routeScanner: laravelRouteScanner/.test(pipeline)],
  ['scanner consumes the injected upstream method authority', /methodAuthority\.judge\(\{ method: declaration\.method, targetMethods: declaration\.targetMethods \}\)/.test(scanner)],
  ['changed upstream method authority adds no semantic foundation dependency', !/semantic\/foundation/.test(contract + authority + scanner + producerRelations)],
  ['remaining scanner relation/subscanner dependencies are explicitly documented instead of falsely declared migrated', /still imports `semantic\/relations` and route producer\/emitter subscanner modules/.test(docs) && /not yet a complete upstream\/CLI migration/.test(docs)],
];
const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`\nPhase 2357 audit: ${checks.length - failed.length}/${checks.length} passed\n`);
if (failed.length) process.exitCode = 1;
