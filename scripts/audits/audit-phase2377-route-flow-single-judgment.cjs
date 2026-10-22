const fs = require('node:fs');
const path = require('node:path');
const sourcePath = path.join(__dirname, '../../packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const checks = [
  ['active scanner imports the existing RouteDeclarationFlow contract', /routeDeclarationFlow, type RouteDeclarationFlow/.test(source)],
  ['controller target projection consumes the already-derived flow', /controllerNameOf = \(flow: RouteDeclarationFlow\)/.test(source)],
  ['action projection consumes the already-derived flow', /actionNameOf = \(declaration: RouteDeclarationAst, flow: RouteDeclarationFlow\)/.test(source)],
  ['emitDeclaration derives route flow once and shares it', (source.match(/routeDeclarationFlow\(declaration\)/g) ?? []).length === 1 && /const flow = routeDeclarationFlow\(declaration\);[\s\S]{0,180}controllerNameOf\(flow\)[\s\S]{0,100}actionNameOf\(declaration, flow\)/.test(source)],
];
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
console.log(`RESULT ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
