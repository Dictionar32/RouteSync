const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const operation = read('packages/core/src/client/HttpRequestExecution.ts');
const client = read('packages/core/src/client/HttpClient.ts');
const sdk = read('packages/sdk/src/defineApi.ts');
const test = read('packages/core/src/client/__tests__/HttpClient.query-operation.phase2356.test.ts');
const coreIndex = read('packages/core/src/index.ts');
const checks = [
  ['existing transport owner is strengthened rather than replaced', /export class HttpClient/.test(client) && /async request<TResponse, TBody>/.test(client)],
  ['single request contract carries final method and target URL', /interface HttpRequestExecution<TBody>[\s\S]*?readonly url: string;[\s\S]*?readonly method: HttpMethod/.test(operation)],
  ['request contract carries body and transport config together', /readonly body: TBody;[\s\S]*?readonly config: AxiosRequestConfig/.test(operation)],
  ['operation contract contains no unknown or any escape hatch', !/\bunknown\b|\bany\b/.test(operation)],
  ['request executor accepts the complete operation contract', /request<TResponse, TBody>\(\s*operation: HttpRequestExecution<TBody>/.test(client)],
  ['executor uses method already supplied by the operation', /const \{ url, method, body, config \} = operation/.test(client)],
  ['executor preserves existing request preparation', /prepareRequest\(body, config\)/.test(client)],
  ['executor invokes the configured Axios instance with operation method and body', /this\.client\.request<TResponse>\(\{[\s\S]*?url,[\s\S]*?method,[\s\S]*?data: processedBody/.test(client)],
  ['SDK sends one complete request operation', /client\.request\(\s*\{[\s\S]*?url: resolvedPath,[\s\S]*?method: route\.method,[\s\S]*?body,[\s\S]*?config: requestConfig/.test(sdk)],
  ['SDK does not reclassify methods before transport', !/route\.method\.toLowerCase\(\)/.test(sdk) && !/client\[method\]/.test(sdk)],
  ['QUERY regression test exercises the real HttpClient method', /client\.request\(\{[\s\S]*?method: 'QUERY'/.test(test)],
  ['QUERY regression test observes request method, URL, and body', /observedMethod/.test(test) && /observedUrl/.test(test) && /observedBody/.test(test)],
  ['QUERY test uses the configured Axios adapter path', /getInstance\(\)\.defaults\.adapter = adapter/.test(test)],
  ['operation contract is exported from the core package surface', /export type \{ HttpRequestExecution \}/.test(coreIndex)],
  ['no method-specific executor interface was added', !/interface QueryHttpClient|interface QueryOperationExecutor/.test(operation + client + sdk)],
  ['transport operation path does not import semantic foundation', !/semantic\/foundation/.test(operation + client + sdk)],
  ['transport operation path does not import semantic relations', !/semantic\/relations?/.test(operation + client + sdk)],
  ['transport operation path does not import scanner submodules', !/subscanners?\//.test(operation + client + sdk)],
];
const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`\nPhase 2356 audit: ${checks.length - failed.length}/${checks.length} passed\n`);
if (failed.length) process.exitCode = 1;
