'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
let passed = 0;
function check(name, condition) {
  if (!condition) { console.error(`FAIL ${name}`); process.exitCode = 1; return; }
  passed += 1; console.log(`PASS ${name}`);
}
function read(relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }
const graph = read('packages/core/src/graph/RouteSyncManifestGraphProjection.ts');
const graphContract = read('packages/core/src/graph/RouteSyncManifestGraphProjectionInterface.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const fixture = read('packages/core/src/compiler/scanner/__test__/ecommerceShopFixtureEndToEndPhase954.spec.ts');
const coreIndex = read('packages/core/src/index.ts');
const dataflow = read('packages/core/src/compiler/analysis/routeSyncManifestDataflowProjection.ts');
const preflight = read('packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts');
const builderContract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
check('graph projection reuses its named existing interface', /interface RouteSyncManifestGraphProjectionInterface/.test(graphContract) && /export const routeSyncManifestGraphProjection:\s*RouteSyncManifestGraphProjectionInterface\s*=\s*Object\.freeze\(/.test(graph));
check('graph projection exposes the domain project operation', /project: \(manifest: RouteSyncManifestFlow\): RouteSyncManifestGraphSurface/.test(graph));
check('CLI scan uses typed graph projection object', /routeSyncManifestGraphProjection\.project\(manifestFlow\)/.test(cliScan) && /routeSyncManifestGraphProjection/.test(cliScan));
check('fixture test uses typed graph projection object', /routeSyncManifestGraphProjection\.project\(manifestFlow\)/.test(fixture));
check('legacy forwarding function is removed from runtime implementation', !/routeSyncManifestGraphSurfaceFromFlow/.test(graph));
check('legacy forwarding function is removed from public core exports', !/routeSyncManifestGraphSurfaceFromFlow/.test(coreIndex));
check('public core barrel exports the projection operation object', /export \{ routeSyncManifestGraphProjection \} from '\.\/graph\/RouteSyncManifestGraphProjection'/.test(coreIndex));
check('dataflow projection remains interface-first and frozen', /export const routeSyncManifestDataflowProjection:\s*RouteSyncManifestDataflowProjectionInterface\s*=\s*Object\.freeze\(/.test(dataflow));
check('request-resolution preflight remains interface-first and frozen', /export const routeManifestRequestResolutionPreflight:\s*RouteManifestRequestResolutionPreflightInterface\s*=\s*Object\.freeze\(/.test(preflight));
check('manifest complete/blocked ADT remains explicit', /ManifestBuilderCompleteJudgment \| ManifestBuilderBlockedJudgment/.test(builderContract));
check('collections.ts remains exactly empty', collections.length === 0);
console.log(`${passed}/11 passed`);
if (passed !== 11) process.exitCode = 1;
