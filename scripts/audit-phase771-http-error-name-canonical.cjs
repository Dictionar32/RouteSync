const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const names = read('packages/core/src/types/upstream/names.ts');
const semantic = read('packages/core/src/types/domain/semanticValues.ts');
const errors = read('packages/core/src/types/domain/httpErrors.ts');

const checks = {
  upstreamHttpErrorName: /export interface HttpErrorName\s*\{[^}]*value:\s*StringValue/.test(names),
  upstreamHttpErrorConstructor: /createHttpErrorName\s*=/.test(names),
  domainDoesNotRedeclareHttpErrorName: !/export interface HttpErrorName\s*\{/.test(semantic),
  domainReexportsUpstreamHttpErrorName: /export type \{[^}]*HttpErrorName/.test(semantic),
  factoryUsesUpstreamHttpErrorName: /httpErrorName\(value: string\): HttpErrorName \{ return createHttpErrorName\(value\); \}/.test(semantic),
  upstreamConversionNameCompatible: /name:\s*descriptor\.name/.test(errors),
  noUnknownCastForHttpErrorName: !/name:\s*[^\n]*as unknown/.test(errors),
};

for (const [key, value] of Object.entries(checks)) console.log(`${key}=${value}`);
console.log(`ALL_PASS=${Object.values(checks).every(Boolean)}`);
