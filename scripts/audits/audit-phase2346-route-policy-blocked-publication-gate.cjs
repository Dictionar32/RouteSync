const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['existing route outcome includes typed policy-blocked arm', read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts').includes("kind: 'laravel_route_scan_policy_blocked'")],
  ['blocked arm preserves exact blocked effective policy', read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts').includes('BlockedEffectiveControllerActionPolicy')],
  ['route scanner keeps complete scan evidence', read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts').includes('readonly scan: LaravelRouteScanJudgment')],
  ['scanner aggregates exact blocked policies from canonical route flow', read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts').includes("artifact.flow.controllerActionPolicy.value.judgment.kind === 'blocked'")],
  ['scanner returns policy-blocked judgment instead of complete scan', read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts').includes("kind: 'laravel_route_scan_policy_blocked'")],
  ['source AST projection has policy-blocked arm', read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts').includes("kind: 'laravel_source_ast_projection_route_policy_blocked'")],
  ['pipeline short-circuits on policy blocker before AST construction', read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts').indexOf("routeScan.kind === 'laravel_route_scan_policy_blocked'") < read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts').indexOf('const routes: readonly RouteAst[]')],
  ['pipeline preserves exact scan judgment', read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts').includes('scan: routeScan')],
  ['manifest builder preserves non-complete projection', read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts').includes("projection.kind !== 'laravel_source_ast_projection_complete'")],
  ['CLI scan stops on manifest_builder_blocked', read('packages/cli/src/commands/scan.ts').includes("scannedManifest.kind === 'manifest_builder_blocked'")],
  ['route policy blocked type exported', read('packages/core/src/index.ts').includes('LaravelRouteScanPolicyBlockedJudgment')],
  ['no semantic foundation import introduced', !read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts').includes('semantic/foundation') && !read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts').includes('semantic/foundation')],
  ['no duplicate v2 contract introduced', !read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts').includes('LaravelRouteScannerV2')],
];
let failed = 0;
for (const [label, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!pass) failed += 1;
}
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
