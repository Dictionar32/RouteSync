const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const parser = read('packages/core/src/compiler/frontend/php/routeAst/routeDeclarationParser.ts');
const contract = read('packages/core/src/types/upstream/routeConstraints.ts');
const build = read('tsdown.config.ts');
const tsconfig = read('tsconfig.json');
const checks = [
  ['route-parser-no-longer-imports-semantic-relations', !parser.includes('semantic/relations')],
  ['route-parser-uses-upstream-route-constraint-adt-eliminator', parser.includes('routeConstraintArgumentAlgebra.match(argument,')],
  ['constraint-adt-has-explicit-visitor-for-every-variant', ['pattern:', 'values:', 'none:'].every(token => contract.includes(token))],
  ['constraint-adt-eliminator-is-exhaustive', contract.includes('const exhaustive: never = argument')],
  ['constraint-adt-is-owned-by-types-upstream', contract.includes('export type RouteConstraintArgument =') && contract.includes('export const matchRouteConstraintArgument')],
  ['upstream-package-subpath-is-published', Boolean(pkg.exports['./upstream'])],
  ['upstream-package-subpath-points-at-build-artifacts', pkg.exports['./upstream']?.types === './dist/upstream.d.ts' && pkg.exports['./upstream']?.import === './dist/upstream.mjs' && pkg.exports['./upstream']?.require === './dist/upstream.js'],
  ['upstream-entrypoint-is-built-and-resolved-by-typescript', build.includes("upstream: 'packages/core/src/upstream.ts'") && tsconfig.includes('@routesync/core/upstream') && tsconfig.includes('./packages/core/src/upstream.ts')],
  ['no-foundation-or-relations-dependency-added-to-route-parser', !/semantic\/(?:foundation|relations)\//.test(parser)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'BLOCKER'} ${name}\n`);
process.stdout.write(`\nPhase 2618: ${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed.\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
