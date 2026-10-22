const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const pipelineContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const index = read('packages/core/src/index.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const checks = [
  ['route scanner interface advances with the closed outcome contract', /readonly contractVersion: 8/.test(contract) && /Promise<LaravelRouteScanOutcome>/.test(contract)],
  ['route scan outcome is a discriminated complete-or-blocked ADT', /export type LaravelRouteScanOutcome = LaravelRouteScanJudgment \| LaravelRouteScanBlockedJudgment/.test(contract) && /kind: 'laravel_route_scan_blocked'/.test(contract)],
  ['complete route judgment retains explicit source-file observations', /sourceFiles: readonly LaravelRouteSourceFileObservation\[\]/.test(contract) && /laravel_route_source_file_scanned/.test(contract) && /laravel_route_source_file_absent_optional_default/.test(contract)],
  ['explicitly selected missing files block rather than emit an empty scan', /sourceSelectionIntent\.kind === 'laravel_route_source_selection_explicit' && missingFiles\.length > 0/.test(scanner) && /explicitly_selected_route_source_file_absent/.test(scanner)],
  ['default absent conventional route files are represented, not silently discarded', /laravel_route_source_file_absent_optional_default/.test(scanner) && /sourceFiles, artifacts: Object\.freeze\(artifacts\)/.test(scanner)],
  ['route pipeline propagates the exact blocked judgment before artifact projection', /if \(routeScan\.kind === 'laravel_route_scan_blocked'\)[\s\S]*?kind: 'laravel_source_ast_projection_route_scan_blocked'[\s\S]*?scan: routeScan/.test(pipeline) && /route_scan_blocked/.test(pipelineContract)],
  ['route pipeline contract version is advanced', /readonly contractVersion: 14/.test(pipelineContract) && /contractVersion: 14/.test(pipeline)],
  ['public type barrel exports the new route outcome ADT', /LaravelRouteScanOutcome, LaravelRouteScanBlockedJudgment, LaravelRouteSourceFileObservation/.test(index)],
  ['manifest builder preserves any non-complete source-AST judgment as typed blocked data', /projection\.kind !== 'laravel_source_ast_projection_complete'[\s\S]*?kind: 'manifest_builder_blocked'[\s\S]*?projection,/.test(manifestBuilder)],
  ['CLI scan and sync stop before publication when route scan is blocked upstream', /manifest_builder_blocked/.test(cliScan) && /manifest_builder_blocked/.test(cliSync)],
  ['no foundation/relations imports added to upstream route/pipeline contracts', !/semantic\/(?:foundation|relations)/.test(contract + pipelineContract)],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} checks passed\n`);
process.exitCode = failed.length ? 1 : 0;
