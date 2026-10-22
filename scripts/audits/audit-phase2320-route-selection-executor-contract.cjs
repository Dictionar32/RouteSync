const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const selection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const checks = [
  ['route scanner contract requires a closed source-selection intent', /sourceSelectionIntent: LaravelRouteSourceSelectionIntent/.test(contract) && !/sourceSelection\?:/.test(contract)],
  ['explicit intent is structurally limited to explicit route files', /kind: 'laravel_route_source_selection_explicit'; readonly selection: Extract<LaravelRouteSourceSelection, \{ readonly kind: 'explicit_route_files' \}>/.test(selection)],
  ['pipeline delegates one complete route scan input without ternary dispatch', /const routeScan = await routeScanner\.scan\(\{[\s\S]*?sourceSelectionIntent: input\.routeSelection,[\s\S]*?\}\);/.test(pipeline) && !/const routeScan = input\.routeSelection\.kind/.test(pipeline)],
  ['scanner selects source files from explicit ADT arms', /switch \(intent\.kind\)/.test(scanner) && /case 'laravel_route_source_selection_default'/.test(scanner) && /case 'laravel_route_source_selection_explicit'/.test(scanner)],
  ['scanner and result contract versions advanced together', /contractVersion: 8/.test(contract) && /contractVersion: 8/.test(scanner)],
  ['scanner no longer infers default from absent optional selection', !/selection\?\.kind \?\? 'project_route_files'/.test(scanner)],
  ['runtime pipeline contract still owns route selection as a single intent', /routeSelection: LaravelRouteSourceSelectionIntent/.test(read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts'))],
  ['no foundation/relations import added to changed route contract and pipeline', !/semantic\/(?:foundation|relations)/.test(contract + selection + pipeline)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} checks passed\n`);
process.exitCode = failed.length ? 1 : 0;
