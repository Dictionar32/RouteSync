const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const operationPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/integratedRouteManifestAuthority.ts');
const operation = fs.readFileSync(operationPath, 'utf8');
const projection = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts'), 'utf8');
const lowerer = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts'), 'utf8');
const index = fs.readFileSync(path.join(root, 'packages/core/src/index.ts'), 'utf8');
const assertions = [
  ['requires injected semantic pipeline', operation.includes('pipeline: RequestTypeDerivationSemanticPipelineInterface')],
  ['uses authority-backed projection', operation.includes('createAuthorityBackedRouteManifestProjection(pipeline)')],
  ['authority projection uses lowering runtime executor path', projection.includes('createAuthorityBackedRouteManifestTypeLowering(pipeline)')],
  ['integrated manifest only follows projected judgment', operation.includes("case 'projected':") && operation.includes("kind: 'integrated_manifest'")],
  ['non-projectable judgment remains explicit ADT', operation.includes("kind: 'manifest_derivation_blocked'")],
  ['manifest lowerer is called only inside projected branch', operation.slice(operation.indexOf("case 'projected':"), operation.indexOf("case 'not_projectable':")).includes('lowerRouteSyncManifestToRouteManifest(') && !operation.slice(operation.indexOf("case 'not_projectable':"), operation.indexOf('default:')).includes('lowerRouteSyncManifestToRouteManifest(')],
  ['source evidence retained in integrated result', operation.includes('sourceEvidence: result.sourceEvidence')],
  ['integrated result passes projection contract to existing lowerer', operation.includes("kind: 'route_manifest_projection'") && operation.includes('lowerRouteSyncManifestToRouteManifest(manifest, baseURL, version')],
  ['existing lowerer consumes RequestType projection', lowerer.includes('requestTypes: projection.requestTypes')],
  ['public operation exported', index.includes("export { createIntegratedRouteManifestAuthority } from './compiler/scanner/wiring/integratedRouteManifestAuthority'")],
  ['no foundation/relation imports in new composition', !/semantic\/(foundation|relations)/.test(operation)],
];
let failures = 0;
for (const [label, pass] of assertions) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!pass) failures += 1;
}
process.stdout.write(`\n${assertions.length - failures}/${assertions.length} assertions passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
