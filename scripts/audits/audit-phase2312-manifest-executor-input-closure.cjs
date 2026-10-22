const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['route-selection intent ADT is owned by route-selection upstream', () => /export type LaravelRouteSourceSelectionIntent\s*=/.test(read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts'))],
  ['route-selection intent has explicit default and explicit variants', () => /kind: 'laravel_route_source_selection_default'/.test(read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts')) && /kind: 'laravel_route_source_selection_explicit'/.test(read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts'))],
  ['pipeline execution input requires route-selection intent', () => /readonly routeSelection: LaravelRouteSourceSelectionIntent/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['manifest builder input is a named closed input contract', () => /interface ManifestBuilderInput/.test(read('packages/core/src/types/upstream/manifestBuilderInterface.ts')) && /readonly kind: 'manifest_builder_input'/.test(read('packages/core/src/types/upstream/manifestBuilderInterface.ts'))],
  ['manifest builder has one required input and no optional route argument', () => /readonly build: \(input: ManifestBuilderInput\)/.test(read('packages/core/src/types/upstream/manifestBuilderInterface.ts')) && !/routeSourceSelection\?/.test(read('packages/core/src/types/upstream/manifestBuilderInterface.ts'))],
  ['manifest construction receives the full input ADT', () => /constructRouteSyncManifest\(input: ManifestBuilderInput\)/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts'))],
  ['manifest builder forwards the supplied intent without reconstructing omission semantics', () => /routeSelection: input\.routeSelection/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts')) && !/routeSourceSelection === undefined/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts'))],
  ['CLI composition requires route-selection intent', () => /readonly routeSelection: LaravelRouteSourceSelectionIntent/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts')) && !/routeSourceSelection\?/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts'))],
  ['CLI composition helper has no optional route-selection parameter', () => /routeSelection: LaravelRouteSourceSelectionIntent/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts')) && !/routeSourceSelection\?/.test(read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'))],
  ['CLI scan and sync pass explicit selection ADT', () => ['packages/cli/src/commands/scan.ts','packages/cli/src/commands/sync.ts'].every(file => /laravel_route_source_selection_explicit/.test(read(file)))],
  ['CLI drift audit passes default selection ADT explicitly', () => /laravel_route_source_selection_default/.test(read('packages/cli/src/commands/audit/driftAuditor.ts'))],
  ['public index exports upstream route intent and manifest input', () => /export type \{ LaravelRouteSourceSelectionIntent \}/.test(read('packages/core/src/index.ts')) && /export type \{ ManifestBuilderInput \}/.test(read('packages/core/src/index.ts'))],
  ['no foundation/relations dependency added to the executor and builder files', () => !/semantic\/(foundation|relations)/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts')) && !/semantic\/(foundation|relations)/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts'))],
];
const failures = checks.filter(([, test]) => !test()).map(([name]) => name);
for (const [name, test] of checks) process.stdout.write(`${test() ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`\n${checks.length - failures.length}/${checks.length} checks passed\n`);
if (failures.length) process.exitCode = 1;
