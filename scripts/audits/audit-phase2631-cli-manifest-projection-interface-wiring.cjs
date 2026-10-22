const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });

const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const composition = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const compositionInterface = read('packages/core/src/index.ts');

for (const [name, source] of [['scan', scan], ['sync', sync]]) {
  check(`${name}-imports-existing-manifest-projection-composition`, /routeManifestProjectionCompositionFactory/.test(source));
  check(`${name}-passes-exact-preflight-packet-to-projection-interface`, /routeManifestProjectionCompositionFactory\.create\(requestTypeDerivationPipeline\)\.project\(\s*requestResolutionPreflight/.test(source) && source.includes('options.baseURL') && source.includes("'6.0.0'"));
  check(`${name}-consumes-closed-projection-result-adt`, /case 'manifest_projected'/.test(source) && /case 'manifest_projection_blocked'/.test(source));
  check(`${name}-does-not-manually-lower-after-semantic-projection`, !/lowerRouteSyncManifestToRouteManifest\s*\(/.test(source));
  check(`${name}-does-not-call-projection-function-outside-composition`, !/projectRouteSyncManifestForRouteManifest\s*\(/.test(source));
}
check('upstream-composition-consumes-preflight-packet-not-reconstructed-manifest', /project: \(preflight: RouteManifestRequestResolutionPreflight/.test(composition) && /projection\.project\(preflight\)/.test(composition) && /lowerRouteSyncManifestToRouteManifest\(preflight\.manifest/.test(composition));
check('upstream-composition-owns-projection-and-lowering-order', /createAuthorityBackedRouteManifestProjection\(pipeline\)/.test(composition) && /lowerRouteSyncManifestToRouteManifest\(/.test(composition) && /kind: 'manifest_projected'/.test(composition) && /kind: 'manifest_projection_blocked'/.test(composition));
check('existing-interface-is-publicly-exported', /export \{ routeManifestProjectionCompositionFactory \}/.test(compositionInterface));

for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}`);
const failed = checks.filter(item => !item.passed);
console.log(`Phase 2631 CLI manifest-projection interface wiring: ${checks.length - failed.length}/${checks.length} assertions passed.`);
if (failed.length) process.exitCode = 1;
