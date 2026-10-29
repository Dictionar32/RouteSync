const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const parser = read('packages/core/src/compiler/frontend/php/routeAst/routeDeclarationParser.ts');
const routeConstraints = read('packages/core/src/types/upstream/routeConstraints.ts');
const syntaxRange = read('packages/core/src/compiler/frontend/php/routeAst/syntaxRange.ts');
const syntaxRelations = read('packages/core/src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts');
const coreIndex = read('packages/core/src/index.ts');
const cliLoader = read('packages/cli/src/standaloneCompositionLoader.ts');
const cliFactory = read('packages/cli/src/upstreamCompositionFactory.ts');
const checks = [
  ['route-parser-does-not-import-relational-sequence-barrel', !parser.includes("from '../../../relational/sequence'" )],
  ['route-parser-uses-interface-first-constraint-adt-operation', parser.includes('routeConstraintArgumentAlgebra.match(argument,')],
  ['upstream-adt-operation-has-named-interface', routeConstraints.includes('export interface RouteConstraintArgumentAlgebraInterface')],
  ['upstream-operation-uses-export-const-name-interface-pattern', /export const routeConstraintArgumentAlgebra:\s*RouteConstraintArgumentAlgebraInterface\s*=/.test(routeConstraints)],
  ['adt-eliminator-is-exhaustive', routeConstraints.includes('const exhaustive: never = argument')],
  ['public-core-entrypoint-exports-canonical-adt-operation', coreIndex.includes('routeConstraintArgumentAlgebra') && coreIndex.includes("./types/upstream/routeConstraints")],
  ['cli-composition-loader-keeps-narrow-upstream-boundary', cliLoader.includes('@routesync/core/upstream')],
  ['cli-factory-keeps-narrow-upstream-boundary', cliFactory.includes('@routesync/core/upstream')],
  ['syntax-range-navigation-has-no-semantic-relation-dependency', !/semantic\/relations|compiler\/relational\/sequence/.test(syntaxRange)],
  ['residual-semantic-syntax-relations-dependency-is-explicitly-detected', /semantic\/relations/.test(syntaxRelations)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'BLOCKER'} ${name}\n`);
process.stdout.write(`\nPhase 2619: ${checks.filter(([, passed]) => passed).length}/${checks.length} checks passed.\n`);
process.stdout.write('Known remaining boundary: routeDeclarationParser still reaches semantic/relations through semanticRouteSyntaxRelations; syntaxRange no longer imports semantic relation helpers or the relational sequence barrel. Full CLI/Core closure is not claimed.\n');
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
