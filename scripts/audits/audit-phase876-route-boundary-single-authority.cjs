const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const scanner = path.join(root, 'packages/core/src/compiler/scanner/subscanners/RouteScanner.ts');
const relations = path.join(root, 'packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const source = fs.readFileSync(scanner, 'utf8');
const relationSource = fs.readFileSync(relations, 'utf8');

const checks = [
  ['bundle computes one boundary per route origin', /const boundary = routeBoundaryContractFromRouteEmission\(route\);/],
  ['bundle derives AST from the shared boundary', /routeProducer\.produce\(routeProducerInputFromRouteBoundary\(boundary,/],
  ['bundle derives flow from the shared boundary', /routeSemanticFlowFromRouteBoundary\(boundary\)/],
  ['legacy emission wrappers are absent from production route modules', !/routeProducerInputFromRouteEmission|routeSemanticFlowFromRouteEmission/.test(source + relationSource)],
  ['boundary remains the only RouteBoundaryContract constructor in relation module', (relationSource.match(/RouteBoundaryContractFactory\.create\(/g) || []).length === 1],
];

const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
const result = {
  phase: 876,
  audit: 'route-boundary-single-authority',
  passed: failed.length === 0,
  checks: Object.fromEntries(checks.map(([name, ok]) => [name, !!ok])),
  failed,
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.passed ? 0 : 1;
