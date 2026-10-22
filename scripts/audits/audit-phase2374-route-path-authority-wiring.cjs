const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const authority = read('packages/core/src/types/upstream/routePathResolutionAuthority.ts');
const type = read('packages/core/src/types/upstream/routePathResolution.ts');
const checks = [
  ['closed upstream path-resolution contract exists', /interface LaravelRoutePathResolutionAuthority/.test(type) && /closed: true/.test(type)],
  ['scanner interface injects canonical path authority', /routePathResolutionAuthority: LaravelRoutePathResolutionAuthority/.test(contract)],
  ['scanner executes the injected path authority', /pathResolutionAuthority\.resolve\(/.test(scanner) && /authorities\.routePathResolutionAuthority/.test(scanner)],
  ['path input comes from canonical evidence', /declaredPath: declarationEvidence\.path/.test(scanner) && /groupPrefixes: declarationEvidence\.prefix/.test(scanner)],
  ['path authority avoids semantic foundation and relation imports', !/semantic\/(?:foundation|relation)/.test(authority)],
  ['duplicate declaration operation authority is absent', !/routeDeclarationOperationAuthority/.test(contract + scanner) && !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/routeDeclarationOperationAuthority.ts'))],
];
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
console.log(`RESULT ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
process.exitCode = checks.every(([, ok]) => ok) ? 0 : 1;
