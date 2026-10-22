const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const routeTypes = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const routeScanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const pipelineTypes = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const manifestBuilder = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const manifestBuilderExecutor = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const index = read('packages/core/src/index.ts');
const responseBlock = pipeline.split("if (routeScan.kind === 'laravel_route_scan_response_blocked')")[1]?.split("if (routeScan.kind === 'laravel_route_scan_policy_blocked')")[0] ?? '';
const checks = [
  ['route scanner exposes a closed response-blocked outcome', routeTypes.includes("kind: 'laravel_route_scan_response_blocked'") && routeTypes.includes('LaravelRouteScanResponseBlockedJudgment')],
  ['route response blocker preserves exact route AST and blocked ADT', routeTypes.includes("readonly response: Extract<import('./endpointBindings').EndpointResponseBinding, { readonly kind: 'controller_response_projection_blocked' }>")],
  ['route scanner collects blockers from canonical RouteAst bindings', routeScanner.includes("artifact.ast.bindings.response.kind === 'controller_response_projection_blocked'")],
  ['route scanner returns blocked outcome before normal/policy completion', routeScanner.includes("kind: 'laravel_route_scan_response_blocked', contractVersion: 27, scan, responses, policies") && routeScanner.indexOf('if (responses.length > 0)') < routeScanner.indexOf("kind: 'laravel_route_scan_policy_blocked'")],
  ['same-scan policy blockers are retained', routeScanner.includes("kind: 'laravel_route_scan_response_blocked', contractVersion: 27, scan, responses, policies")],
  ['source-AST projection has a typed route-response blocker', pipelineTypes.includes("kind: 'laravel_source_ast_projection_route_response_blocked'") && pipelineTypes.includes('LaravelRouteScanResponseBlockedJudgment')],
  ['source-AST blocker preserves exact invocation inventory receipt', pipelineTypes.split("kind: 'laravel_source_ast_projection_route_response_blocked'")[1]?.includes('readonly invocationInventoryReceipt: Receipt;') === true],
  ['pipeline forwards the blocker before resource and response scanning', responseBlock.includes("kind: 'laravel_source_ast_projection_route_response_blocked'") && pipeline.indexOf("if (routeScan.kind === 'laravel_route_scan_response_blocked')") < pipeline.indexOf('const resourceScan = await resourceScanner.scan')],
  ['pipeline contract version is advanced consistently', pipelineTypes.includes('readonly contractVersion: 17;') && pipeline.includes('contractVersion: 17,\n        input,\n        dependencies,\n        async execute():')],
  ['route scanner contract and judgment versions are advanced consistently', routeTypes.includes('readonly contractVersion: 33;') && routeTypes.includes('readonly contractVersion: 27;') && routeScanner.includes('contractVersion: 33,')],
  ['manifest builder contract preserves every non-complete projection as blocked', manifestBuilder.includes("Exclude<LaravelSourceAstProjectionJudgment, { readonly kind: 'laravel_source_ast_projection_complete' }>")],
  ['manifest builder executor refuses to build from any blocked projection', manifestBuilderExecutor.includes("if (projection.kind !== 'laravel_source_ast_projection_complete')") && manifestBuilderExecutor.includes("kind: 'manifest_builder_blocked'")],
  ['public exports expose the new route response blocker', index.includes('LaravelRouteScanResponseBlockedJudgment')],
  ['blocker transport does not normalize response into void or empty', !responseBlock.includes('VoidResponseDescriptor') && !responseBlock.includes("kind: 'empty_response'")],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase2415 route response blocker assertions: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
