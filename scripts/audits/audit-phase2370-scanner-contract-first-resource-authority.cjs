const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const resource = read('packages/core/src/types/upstream/routeResourceFlow.ts');
const checks = [
  ['existing RouteResourceFlowAuthority is closed and accepts canonical declaration evidence', /interface RouteResourceFlowAuthority/.test(resource) && /resolveDeclaration: \(input: RouteResourceDeclarationInput\)/.test(resource) && /declaration: RouteDeclarationEvidence/.test(resource)],
  ['scanner injects existing resource authority', /routeResourceFlowAuthority: RouteResourceFlowAuthority/.test(contract) && /authorities\.routeResourceFlowAuthority/.test(scanner)],
  ['scanner passes canonical evidence into resource judgment', /resourceFlowAuthority\.resolveDeclaration\([\s\S]*?declaration: declarationEvidence/.test(scanner)],
  ['no duplicate declaration operation authority is defined or wired', !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/routeDeclarationOperationAuthority.ts')) && !/routeDeclarationOperationAuthority/.test(contract + scanner)],
];
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
console.log(`RESULT ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
process.exitCode = checks.every(([, ok]) => ok) ? 0 : 1;
