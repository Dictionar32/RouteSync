const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelRouteDeclarationMethodSemanticAuthority.ts');
const syntax = read('packages/core/src/compiler/frontend/php/routeAst/syntaxValue.ts');
const syntaxRelations = read('packages/core/src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts');
const ast = read('packages/core/src/compiler/frontend/php/routeAst/routeDeclarationAst.ts');
const flow = read('packages/core/src/compiler/frontend/php/routeAst/routeDataFlow.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const manifest = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const vocabulary = read('packages/core/src/types/upstream/routeExecutionVocabulary.ts');
const routeAst = read('packages/core/src/types/upstream/route.ts');
const httpVocabulary = read('packages/core/src/types/domain/httpVocabulary.ts');
const requestTypes = read('packages/core/src/types/request.ts');
const ir = read('packages/core/src/compiler/ir/contract/types.ts');
const producer = read('packages/core/src/compiler/scanner/operations/routeProducerRelations.ts');
const sdkExecutor = read('packages/sdk/src/defineApi.ts');
const httpClient = read('packages/core/src/client/HttpClient.ts');
const phaseDoc = read('packages/core/src/types/upstream/docs/PHASE2354-ROUTE-QUERY-JUDGMENT-WIRING.md');
const checks = [
  ['existing Laravel route-method vocabulary owns query', /'head' \| 'query' \| 'match'/.test(contract)],
  ['query is a distinct closed judgment arm', /kind: 'laravel_route_declaration_method_query'; readonly method: 'query'/.test(contract)],
  ['upstream authority returns query judgment directly', /case 'query':\s*return queryMethod\(\)/.test(authority)],
  ['authority contract version is synchronized', /contractVersion: 8/.test(contract) && /contractVersion: 8/.test(authority)],
  ['Laravel scanner contract and judgments use version 26', (contract.match(/contractVersion: 26/g) || []).length >= 4 && /contractVersion: 26/.test(scanner)],
  ['lexer recognizes Route::query declaration', /\['query', 'query'\]/.test(syntax) && /\['query', 'query'\]/.test(syntaxRelations)],
  ['QUERY target verb in match arguments is recognized', /\['QUERY', 'query'\]/.test(syntax)],
  ['AST preserves upstream target-method vocabulary', /LaravelRouteMethod, LaravelRouteTargetMethod/.test(ast) && /readonly targetMethods: readonly LaravelRouteTargetMethod\[\]/.test(ast)],
  ['dataflow catalog accounts for query without reclassifying it', /query: 'standard'/.test(flow)],
  ['scanner consumes query judgment and emits QUERY method', /case 'laravel_route_declaration_method_query':[\s\S]*?emitStandardRoutes\(methodJudgment\.httpMethods/.test(scanner)],
  ['scanner does not classify query using payload-location semantics', !/RoutePayloadLocation\.Query/.test(scanner)],
  ['HTTP QUERY is part of the canonical upstream method vocabulary', /QUERY: 'QUERY'/.test(vocabulary)],
  ['route method ADT has a query case', /kind: 'query'/.test(routeAst)],
  ['request client method vocabulary includes QUERY', /'OPTIONS' \| 'HEAD' \| 'QUERY'/.test(requestTypes)],
  ['HTTP method semantic registry gives QUERY explicit read/safe/idempotent/body semantics', /\[HttpMethod\.QUERY\]: \{[\s\S]*?isMutating: false,[\s\S]*?isSafe: true,[\s\S]*?isIdempotent: true,[\s\S]*?hasBody: true/.test(httpVocabulary)],
  ['IR endpoint contract can carry QUERY', /'OPTIONS' \| 'QUERY'/.test(ir)],
  ['actual source AST pipeline injects the Laravel route scanner', /routeScanner: laravelRouteScanner/.test(pipeline)],
  ['manifest builder executes the source AST pipeline', /laravelSourceAstPipeline\.execute\(pipelineInput\)/.test(manifest)],
  ['no new semantic foundation dependency in changed upstream/lexer/wiring path', !/semantic\/foundation/.test(contract + authority + syntax + syntaxRelations + ast + flow + scanner)],
  ['judgment is consumed by the actual scanner rather than left as an unused interface', /methodAuthority\.judge\(\{ method: declaration\.method, targetMethods: declaration\.targetMethods \}\)/.test(scanner) && /methodJudgment\.kind/.test(scanner)],
  ['follow-up SDK executor consumes the upstream HTTP method without narrowing', /client\.request\(\s*\{[\s\S]*?method: route\.method/.test(sdkExecutor) && /async request<TResponse, TBody>\([\s\S]*?HttpRequestExecution<TBody>/.test(httpClient) && /not a claim of full generated-client QUERY support/.test(phaseDoc)],
];
const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`\nPhase 2354 audit: ${checks.length - failed.length}/${checks.length} passed\n`);
if (failed.length) process.exitCode = 1;
