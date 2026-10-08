const fs = require('node:fs');
const checks = [
  ['ModelSymbolTable barrel keeps interfaces type-only', "packages/core/src/compiler/scanner/symbols/model/index.ts", /export type \{\s*OriginModelSymbol\s*\}/s.test(fs.readFileSync('packages/core/src/compiler/scanner/symbols/model/index.ts', 'utf8')) && /export type \{ ModelSymbolTable \}/.test(fs.readFileSync('packages/core/src/compiler/scanner/symbols/model/index.ts', 'utf8'))],
  ['symbol entry barrel keeps interfaces type-only', "packages/core/src/compiler/scanner/symbols/ModelSymbolTable.ts", /export type \{ ResolvedPropertyBinding, OriginModelSymbol, ModelSymbolTable \}/.test(fs.readFileSync('packages/core/src/compiler/scanner/symbols/ModelSymbolTable.ts', 'utf8'))],
  ['core entrypoint exports symbol interfaces as types', 'packages/core/src/index.ts', /export type \{ ModelSymbolTable, OriginModelSymbol \}/.test(fs.readFileSync('packages/core/src/index.ts', 'utf8'))],
  ['Request imports contract types type-only', 'packages/core/src/client/Request.ts', /import type \{ HttpMethod, RequestOptions, RequestOptionsContract \}/.test(fs.readFileSync('packages/core/src/client/Request.ts', 'utf8'))],
  ['response descriptor base is type-only in route barrel', 'packages/core/src/types/route.ts', /type ResponseDescriptorBase/.test(fs.readFileSync('packages/core/src/types/route.ts', 'utf8'))],
  ['response descriptor base is type-only in domain response barrel', 'packages/core/src/types/domain/responses.ts', /type ResponseDescriptorBase/.test(fs.readFileSync('packages/core/src/types/domain/responses.ts', 'utf8'))],
  ['composeUpstreamWiring has runtime owner export', 'packages/core/src/types/interfaces/interfaceComposition.ts', /export const composeUpstreamWiring/.test(fs.readFileSync('packages/core/src/types/interfaces/interfaceComposition.ts', 'utf8'))],
];
let failed = 0;
for (const [name, , ok] of checks) { if (ok) process.stdout.write(`PASS ${name}\n`); else { failed++; process.stdout.write(`FAIL ${name}\n`); } }
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length} passed; ${failed} failed\n`);
process.exitCode = failed ? 1 : 0;
