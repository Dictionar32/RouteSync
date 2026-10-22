const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['active CLI scan consumes canonical manifest projection', /projectRouteSyncManifestForRouteManifest\(completeManifest\)/.test(read('packages/cli/src/commands/scan.ts'))],
  ['active CLI sync consumes canonical manifest projection', /projectRouteSyncManifestForRouteManifest\(completeManifest\)/.test(read('packages/cli/src/commands/sync.ts'))],
  ['source AST pipeline preserves response-blocked route judgment', /routeScan\.kind === 'laravel_route_scan_response_blocked'/.test(read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'))],
  ['manifest builder preserves non-complete source projection', /kind: 'manifest_builder_blocked'/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts'))],
  ['CLI scan stops on manifest builder blocker before projection', /scannedManifest\.kind === 'manifest_builder_blocked'[\s\S]*?process\.exit\(1\)[\s\S]*?projectRouteSyncManifestForRouteManifest/.test(read('packages/cli/src/commands/scan.ts'))],
  ['CLI sync stops on manifest builder blocker before projection', /scannedManifest\.kind === 'manifest_builder_blocked'[\s\S]*?process\.exit\(1\)[\s\S]*?projectRouteSyncManifestForRouteManifest/.test(read('packages/cli/src/commands/sync.ts'))],
  ['canonical endpoint response ADT retains explicit blocked variant', /kind: 'controller_response_projection_blocked'/.test(read('packages/core/src/types/upstream/endpointBindings.ts'))],
  ['IR response helper retains exact upstream blocked judgment', /type: 'blocked'; readonly judgment: Extract<EndpointResponseBinding, \{ readonly kind: 'controller_response_projection_blocked' \}>/.test(read('packages/core/src/types/ir/endpointIrTypes.ts'))],
  ['Phase2417 response helper has no production callsite outside its declaration', (() => { const files = ['packages/core/src/ir/domain/request-endpoint/endpointRefs.ts']; const count = files.reduce((sum, file) => sum + (read(file).match(/buildResponseReference/g) || []).length, 0); return count === 1; })()],
  ['active RequestType lowering still calls non-authority projection pipeline', /requestTypeDerivationProjectionPipeline\.derive/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts'))],
  ['authority-backed RequestType projection is not wired into active CLI projection', !/createAuthorityBackedRouteManifestProjection/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts'))],
  ['upstream semantic type derivation contract already exists', /SemanticTypeDerivationRuntimeExecutorInterface/.test(read('packages/core/src/types/upstream/semanticTypeDerivationInterface.ts'))],
  ['semantic type facade delegates through the existing executor', /runtimeExecutor\.execute\(/.test(read('packages/core/src/compiler/scanner/subscanners/SemanticTypeDeriver.ts'))],
];
let failures = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
  if (!passed) failures += 1;
}
console.log(`\n${checks.length - failures}/${checks.length} assertions passed`);
if (failures > 0) process.exitCode = 1;
