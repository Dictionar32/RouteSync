const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const scanCli = read('packages/cli/src/commands/scan.ts');
const syncCli = read('packages/cli/src/commands/sync.ts');
const routeScanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const routeContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const sourceAstPipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const scanPreflight = scanCli.includes('existsSync(selectedRouteFile)') || scanCli.includes('Selected route source does not exist');
const syncPreflight = syncCli.includes('pathExists(selectedRouteFile)') || syncCli.includes('Selected route source does not exist');
const checks = [
  ['scan CLI passes explicit route selection into the upstream composition', scanCli.includes("kind: 'laravel_route_source_selection_explicit'") && scanCli.includes('buildManifestWithInvocationPipeline')],
  ['sync CLI passes explicit route selection into the upstream composition', syncCli.includes("kind: 'laravel_route_source_selection_explicit'") && syncCli.includes('buildManifestWithInvocationPipeline')],
  ['scan CLI no longer preempts typed missing-route judgment with filesystem exception', !scanPreflight],
  ['sync CLI no longer preempts typed missing-route judgment with filesystem exception', !syncPreflight],
  ['upstream route scanner owns explicit missing-file judgment', routeScanner.includes("kind: 'laravel_route_scan_blocked'") && routeScanner.includes("reason: 'explicitly_selected_route_source_file_absent'" )],
  ['route scanner contract exposes missing-file blocker as a closed outcome', routeContract.includes("kind: 'laravel_route_scan_blocked'") && routeContract.includes('LaravelRouteScanOutcome')],
  ['source-AST pipeline preserves exact route blocker', sourceAstPipeline.includes("kind: 'laravel_source_ast_projection_route_scan_blocked'") && sourceAstPipeline.includes('scan: routeScan')],
  ['manifest builder preserves non-complete projection as typed blocker', manifestBuilder.includes("kind: 'manifest_builder_blocked'") && manifestBuilder.includes('projection,')],
  ['scan CLI handles manifest-builder blocker before publishing outputs', scanCli.indexOf("scannedManifest.kind === 'manifest_builder_blocked'") < scanCli.indexOf('ManifestGenerator.save')],
  ['sync CLI handles manifest-builder blocker before publishing outputs', syncCli.indexOf("scannedManifest.kind === 'manifest_builder_blocked'") < syncCli.indexOf('ManifestGenerator.save')],
  ['composition invokes manifest builder only with validated inventory receipt', composition.includes("case 'laravel_controller_invocation_semantic_judgment_inventory_validated':") && composition.includes('manifestBuilder.build')],
  ['no new duplicate route scanner contract', !routeContract.includes('LaravelRouteScannerV2')],
  ['no foundation dependency introduced', !routeScanner.includes('semantic/foundation') && !routeContract.includes('semantic/foundation')],
  ['no source-route fallback silently converts missing explicit file to empty success', routeScanner.includes("sourceSelectionIntent.kind === 'laravel_route_source_selection_explicit' && missingFiles.length > 0")],
  ['both CLI commands retain exact upstream blocker reporting', scanCli.includes('JSON.stringify(scannedManifest.projection)') && syncCli.includes('JSON.stringify(scannedManifest.projection)')],
];
let failed = 0;
for (const [label, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!pass) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
