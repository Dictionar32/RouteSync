import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const checks = [
  ['core public entry point exports the route-source selection authority', read('packages/core/src/index.ts').includes('laravelRouteSourceSelectionAuthority') && read('packages/core/src/index.ts').includes('LaravelRouteSourceSelection')],
  ['route source selection is a closed ADT', read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts').includes("readonly kind: 'project_route_files'") && read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts').includes("readonly kind: 'explicit_route_files'")],
  ['manifest builder input requires scan intent separately from project identity', read('packages/core/src/types/upstream/manifestBuilderInterface.ts').includes('routeSelection: LaravelRouteSourceSelectionIntent') && !read('packages/core/src/types/upstream/manifestBuilderInterface.ts').includes('routeSelection?:')],
  ['manifest builder forwards the exact route-selection intent to the source-AST pipeline', read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts').includes('routeSelection: input.routeSelection')],
  ['source AST pipeline forwards the exact selection intent to route scanner', read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts').includes('sourceSelectionIntent: input.routeSelection')],
  ['route scanner handles default and explicit intent variants', read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts').includes("case 'laravel_route_source_selection_default'") && read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts').includes("case 'laravel_route_source_selection_explicit'")],
  ['scan command builds explicit selection from --input', read('packages/cli/src/commands/scan.ts').includes('path.resolve(targetDir, options.input)') && read('packages/cli/src/commands/scan.ts').includes("kind: 'laravel_route_source_selection_explicit'")],
  ['scan rejects a missing explicit route source before manifest construction', read('packages/cli/src/commands/scan.ts').includes('Selected route source does not exist')],
  ['sync rejects a missing explicit route source before manifest construction', read('packages/cli/src/commands/sync.ts').includes('Selected route source does not exist')],
  ['sync command builds explicit selection from --input', read('packages/cli/src/commands/sync.ts').includes('path.resolve(targetDir, options.input)') && read('packages/cli/src/commands/sync.ts').includes("kind: 'laravel_route_source_selection_explicit'")],
  ['composition preserves selection through receipt closure into manifest builder', read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts').includes('routeSelection')],
];

const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`\n${checks.length - failures.length}/${checks.length} checks passed\n`);
if (failures.length > 0) process.exitCode = 1;
