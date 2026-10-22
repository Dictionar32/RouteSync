'use strict';
const ts = require('typescript');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const filename = path.resolve('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const source = fs.readFileSync(filename, 'utf8');
const javascript = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = module.paths;
loaded.require = (specifier) => specifier.includes('semanticValues')
  ? { SemanticValueFactory: { resourceName: (value) => ({ value: { value } }) } }
  : require(specifier);
loaded._compile(javascript, filename);
const operations = loaded.exports.requestTypeDerivationSourceEvidenceInventory;
const value = (raw) => ({ value: { value: raw } });
const route = (method, pathName, name, resource, domain, group) => ({
  coordinates: { method, path: value(pathName), name: value(name) },
  domain: { resource: value(resource), domain: value(domain), group: value(group) },
});
const routeA = operations.canonicalRouteIdentity(route('GET', '/users', 'users', 'User', 'web', 'api'));
const routeSame = operations.canonicalRouteIdentity(route('GET', '/users', 'users', 'User', 'web', 'api'));
const routeDifferentButKeyForged = {
  ...operations.canonicalRouteIdentity(route('POST', '/users', 'users', 'User', 'web', 'api')),
  semanticKey: routeA.semanticKey,
};
const request = (kind, name, formType) => kind === 'http_request_identity'
  ? { kind, request: value(name) }
  : { kind, request: value(name), formType: value(formType) };
const requestA = operations.canonicalRequestIdentity(request('form_request_identity', 'StoreUser', 'UserForm'));
const requestSame = operations.canonicalRequestIdentity(request('form_request_identity', 'StoreUser', 'UserForm'));
const requestDifferentButKeyForged = {
  ...operations.canonicalRequestIdentity(request('form_request_identity', 'StoreUser', 'AdminForm')),
  semanticKey: requestA.semanticKey,
};
const checks = [
  ['same structural route identity compares equal', operations.sameCanonicalRouteIdentity(routeA, routeSame) === true],
  ['different structural route identity compares unequal despite same key', operations.sameCanonicalRouteIdentity(routeA, routeDifferentButKeyForged) === false],
  ['same tagged request identity compares equal', operations.sameCanonicalRequestIdentity(requestA, requestSame) === true],
  ['different tagged request identity compares unequal despite same key', operations.sameCanonicalRequestIdentity(requestA, requestDifferentButKeyForged) === false],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`\nPhase 2710 runtime identity checks: ${checks.length - failures}/${checks.length} passed.\n`);
process.exitCode = failures === 0 ? 0 : 1;
