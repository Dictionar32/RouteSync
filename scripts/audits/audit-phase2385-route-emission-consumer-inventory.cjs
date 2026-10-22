const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const sourceRoot = path.join(root, 'packages/core/src');
const scanner = fs.readFileSync(path.join(sourceRoot, 'compiler/scanner/wiring/laravelRouteScanner.ts'), 'utf8');
const relationAdapter = fs.readFileSync(path.join(sourceRoot, 'compiler/scanner/subscanners/routeProducerRelations.ts'), 'utf8');
const emitter = fs.readFileSync(path.join(sourceRoot, 'compiler/scanner/subscanners/route-scanner/routeEmitter.ts'), 'utf8');
const checks = [
  ['active scanner consumes existing RouteBoundaryContract', scanner.includes("import type { RouteBoundaryContract } from '../../../types/upstream/route'")],
  ['active scanner has no RouteEmission dependency', !scanner.includes('RouteEmission')],
  ['boundary adapter consumes resolved route facts rather than RouteEmission', relationAdapter.includes('routeBoundaryContractFromRouteFacts') && !relationAdapter.includes('routeBoundaryContractFromRouteEmission')],
  ['emitter returns canonical boundaries and no RouteEmission ADT remains', emitter.includes('readonly RouteBoundaryContract[]') && !emitter.includes('RouteEmission')],
  ['canonical upstream producer is not owned by a subscanner alias', fs.existsSync(path.join(sourceRoot, 'types/upstream/routeProducer.ts')) && !fs.existsSync(path.join(sourceRoot, 'compiler/scanner/subscanners/routeProducer.ts'))],
  ['legacy RouteScanner class is retired', !fs.existsSync(path.join(sourceRoot, 'compiler/scanner/subscanners/RouteScanner.ts'))],
];
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.filter(([, pass]) => pass).length}/${checks.length}\n`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
