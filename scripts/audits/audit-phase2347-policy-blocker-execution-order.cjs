const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const routeContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const astContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const scanCli = read('packages/cli/src/commands/scan.ts');
const syncCli = read('packages/cli/src/commands/sync.ts');
const routeScanAt = pipeline.indexOf('const routeScan = await routeScanner.prepare({');
const resourceScanAt = pipeline.indexOf('const resourceScan = await resourceScanner.scan({');
const responseScanAt = pipeline.indexOf('const responseBundle = await responseScanner.scan(Object.freeze({');
const serviceScanAt = pipeline.indexOf('const serviceJudgment = await dependencies.serviceScanner.scan({');
const blockedAt = pipeline.indexOf("routeScan.kind === 'laravel_route_scan_policy_blocked'");
const checks = [
  ['existing route scanner contract remains canonical', routeContract.includes('interface LaravelRouteScannerInterface') && !routeContract.includes('LaravelRouteScannerV2')],
  ['existing route outcome preserves typed blocked policy', routeContract.includes("kind: 'laravel_route_scan_policy_blocked'") && routeContract.includes('BlockedEffectiveControllerActionPolicy')],
  ['existing source-AST projection preserves exact blocked route judgment', astContract.includes("kind: 'laravel_source_ast_projection_route_policy_blocked'") && astContract.includes('scan: import(\'./laravelRouteScannerInterface\').LaravelRouteScanPolicyBlockedJudgment')],
  ['prepared route operation is executed after controller scan', pipeline.indexOf('const controllerScan = await controllerScanner.scan({') < routeScanAt && pipeline.includes('}).execute();')],
  ['route scan is gated before resource scan', routeScanAt >= 0 && resourceScanAt > routeScanAt],
  ['route policy blocker returns before resource scanner executes', blockedAt > routeScanAt && blockedAt < resourceScanAt],
  ['route policy blocker returns before response scanner executes', blockedAt > routeScanAt && blockedAt < responseScanAt],
  ['route policy blocker returns before service scanner executes', blockedAt > routeScanAt && blockedAt < serviceScanAt],
  ['blocked projection preserves the exact scanner judgment', pipeline.includes('scan: routeScan')],
  ['manifest builder still blocks every non-complete projection', manifestBuilder.includes("projection.kind !== 'laravel_source_ast_projection_complete'")],
  ['CLI scan stops before manifest and IR generation', scanCli.includes("scannedManifest.kind === 'manifest_builder_blocked'")],
  ['CLI sync stops before manifest and SDK generation', syncCli.includes("scannedManifest.kind === 'manifest_builder_blocked'")],
  ['no semantic foundation import introduced', !pipeline.includes('semantic/foundation') && !routeContract.includes('semantic/foundation')],
  ['no duplicate source-AST pipeline contract introduced', !astContract.includes('LaravelSourceAstPipelineV2')],
];
let failed = 0;
for (const [label, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!pass) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
