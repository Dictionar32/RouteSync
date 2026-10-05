const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cli = path.join(root, 'packages', 'cli', 'src');
const sdkTests = path.join(root, 'packages', 'sdk', 'tests');

function files(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) out.push(...files(p));
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const production = files(cli);
const text = p => fs.readFileSync(p, 'utf8');
const rel = p => path.relative(root, p).replace(/\\/g, '/');

const routeLegacySymbols = /RouteSemanticFlowContract|RouteSemanticFlowLegacy|from ['"][^'"]*scannedRouteTypes['"]|calculateRouteHash|routeHasher|routeResolver|routeResponseResolver/;
const productionLegacyRefs = production
  .filter(p => routeLegacySymbols.test(text(p)))
  .map(rel);

const helperFiles = [
  'packages/cli/src/utils/incremental/types/scannedRouteTypes.ts',
  'packages/cli/src/utils/incremental/routeHasher.ts',
  'packages/cli/src/utils/incremental/routeResolver.ts',
  'packages/cli/src/utils/incremental/routeResponseResolver.ts'
].map(p => ({
  path: p,
  exists: fs.existsSync(path.join(root, p)),
  bytes: fs.existsSync(path.join(root, p)) ? fs.statSync(path.join(root, p)).size : -1
}));

const manifestTypes = text(path.join(cli, 'utils/incremental/types/scannedManifestTypes.ts'));
const manifestHasRouteAny = /routes\??\s*:\s*[^;\n]*\bany\b/.test(manifestTypes);
const manifestHasLegacyRoute = /RouteSemanticFlow(?:Contract|Legacy)/.test(manifestTypes);
const incremental = text(path.join(cli, 'utils/incremental.ts'));
const canonicalRouteImport = /export type \{ RouteSemanticFlow \} from ['"]@routesync\/core['"]/.test(text(path.join(cli, 'utils/incremental/incrementalTypes.ts')));
const canonicalManifestRoute = /routes:\s*RouteSemanticFlow\[\]/.test(manifestTypes) || /routes:\s*readonly RouteSemanticFlow\[\]/.test(manifestTypes);
const incrementalExportsHash = /calculateRouteHash/.test(incremental);
const sdkLegacyHashRefs = files(sdkTests).filter(p => /calculateRouteHash|RouteSemanticFlowFactory|ScannedManifestDescriptor/.test(text(p))).map(rel);

const result = {
  phase: 833,
  canonicalRouteAuthority: 'packages/core/src/types/domain/routes.ts::RouteSemanticFlow',
  canonicalIncrementalRouteImport: canonicalRouteImport,
  canonicalManifestRoute,
  manifestRouteContainsAny: manifestHasRouteAny,
  manifestRouteContainsLegacyRouteType: manifestHasLegacyRoute,
  activeIncrementalHashExport: incrementalExportsHash,
  productionLegacyRouteRefs: productionLegacyRefs,
  preservedLegacyRouteHelpers: helperFiles,
  sdkLegacyRouteTestRefs: sdkLegacyHashRefs,
  routeBoundaryClosed: canonicalRouteImport && canonicalManifestRoute && !manifestHasRouteAny && !manifestHasLegacyRoute && !incrementalExportsHash && productionLegacyRefs.length === 0,
  preservedLegacyHelpersEmpty: helperFiles.every(x => x.exists && x.bytes === 0),
  recommendation: 'Keep legacy route helper/type files preserved and empty; CLI incremental route semantics consume core RouteSemanticFlow only.'
};

console.log(JSON.stringify(result, null, 2));
if (!result.routeBoundaryClosed || !result.preservedLegacyHelpersEmpty) process.exitCode = 1;
