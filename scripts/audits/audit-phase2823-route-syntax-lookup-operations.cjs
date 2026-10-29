const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const sourcePath = path.join(root, 'packages/core/src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const upstreamIndex = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/index.ts'), 'utf8');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['route method lookup has explicit interface', /interface RouteMethodLookupOperationInterface\s*\{[\s\S]*?readonly lookup:/.test(source)],
  ['route constraint method lookup has explicit interface', /interface RouteConstraintMethodLookupOperationInterface\s*\{[\s\S]*?readonly lookup:/.test(source)],
  ['resource method lookup has explicit interface', /interface ResourceMethodLookupOperationInterface\s*\{[\s\S]*?readonly lookup:/.test(source)],
  ['route method lookup runtime object is explicitly typed and frozen', /export const routeMethodLookupOperation:\s*RouteMethodLookupOperationInterface\s*=\s*Object\.freeze\(\{/.test(source)],
  ['constraint lookup runtime object is explicitly typed and frozen', /export const routeConstraintMethodLookupOperation:\s*RouteConstraintMethodLookupOperationInterface\s*=\s*Object\.freeze\(\{/.test(source)],
  ['resource lookup runtime object is explicitly typed and frozen', /export const resourceMethodLookupOperation:\s*ResourceMethodLookupOperationInterface\s*=\s*Object\.freeze\(\{/.test(source)],
  ['legacy function-shaped lookup exports removed', !/export const (routeMethod|routeConstraintMethod|resourceMethod)\s*=/.test(source)],
  ['route-path ADT retains domain continuation', /continueForAcceptance/.test(source)],
  ['route-path acceptance remains an explicit operation', /routePathTokenAcceptanceOperation:\s*RoutePathTokenAcceptanceOperationInterface/.test(source)],
  ['upstream collections barrel placeholder remains empty', fs.statSync(collectionsPath).size === 0],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`Phase 2823 route syntax lookup operation audit: ${checks.length - failed}/${checks.length} checks passed.`);
if (failed) process.exitCode = 1;
