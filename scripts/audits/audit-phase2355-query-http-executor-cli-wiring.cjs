const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const sdk = read('packages/sdk/src/defineApi.ts');
const client = read('packages/core/src/client/HttpClient.ts');
const clientVocabulary = read('packages/core/src/types/upstream/routeExecutionVocabulary.ts');
const requestTypes = read('packages/core/src/types/request.ts');
const emitter = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const generator = read('packages/cli/src/generators/SDKGenerator.ts');
const routeScanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const manifest = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const files = [sdk, client, emitter, generator];
const checks = [
  ['upstream HTTP method vocabulary includes QUERY', /QUERY: 'QUERY'/.test(clientVocabulary)],
  ['public request route method contract includes QUERY', /'OPTIONS' \| 'HEAD' \| 'QUERY'/.test(requestTypes)],
  ['CLI endpoint emitter preserves the classified method without reinterpretation', /method: '\$\{route\.method\}'/.test(emitter)],
  ['CLI generator emits defineApi SDK endpoints', /defineApi, endpoint/.test(generator) && /emitApiObjectLines/.test(generator)],
  ['SDK executor passes the upstream method contract directly', /client\.request\(\s*\{[\s\S]*?method: route\.method,[\s\S]*?body,[\s\S]*?config: requestConfig/.test(sdk)],
  ['SDK executor no longer narrows or lowercases methods', !/route\.method\.toLowerCase\(\)/.test(sdk) && !/client\[method\]/.test(sdk)],
  ['existing HttpClient owns a typed unified request operation', /async request<TResponse, TBody>\([\s\S]*?HttpRequestExecution<TBody>/.test(client) && /interface HttpRequestExecution<TBody>/.test(read('packages/core/src/client/HttpRequestExecution.ts'))],
  ['unified operation executes through configured Axios instance', /this\.client\.request<TResponse>\(\{[\s\S]*?url,[\s\S]*?method,[\s\S]*?data: processedBody/.test(client)],
  ['request operation uses the existing request/body preparation contract', /prepareRequest\(body, config\)/.test(client) && /const \{ url, method, body, config \} = operation/.test(client)],
  ['configured request interceptor remains attached to the same Axios instance', /this\.client\.interceptors\.request\.use/.test(client) && /this\.client\.interceptors\.response\.use/.test(client)],
  ['no method-based semantic classification remains in SDK execution', !/method\s*===\s*['"](get|delete)['"]/.test(sdk) && !/method\s*===\s*['"](post|put|patch|query)['"]/.test(sdk)],
  ['upstream route scanner emits QUERY from the closed judgment', /case 'laravel_route_declaration_method_query':[\s\S]*?emitStandardRoutes\(methodJudgment\.httpMethods/.test(routeScanner)],
  ['source AST pipeline injects the active Laravel route scanner', /routeScanner: laravelRouteScanner/.test(pipeline)],
  ['manifest builder executes the source AST pipeline used by CLI', /laravelSourceAstPipeline\.execute\(pipelineInput\)/.test(manifest)],
  ['active SDK executor path adds no semantic foundation dependency', !/semantic\/foundation/.test(sdk + client + emitter + generator)],
  ['active SDK executor path adds no semantic relation dependency', !/semantic\/relation/.test(sdk + client + emitter + generator)],
  ['active SDK executor path adds no subscanner dependency', !/subscanners?\//.test(sdk + client + emitter + generator)],
  ['executor accepts complete method evidence rather than creating a new per-verb interface', !/interface\s+QueryHttpClient|interface\s+QueryOperationExecutor/.test(client + sdk)],
];
const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`\nPhase 2355 audit: ${checks.length - failed.length}/${checks.length} passed\n`);
if (failed.length) process.exitCode = 1;
