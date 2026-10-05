const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cli = path.join(root, 'packages', 'cli', 'src');
const packages = path.join(root, 'packages');

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
const allProduction = files(packages).filter(p => !p.includes(`${path.sep}tests${path.sep}`) && !p.includes(`${path.sep}__tests__${path.sep}`));
const text = p => fs.readFileSync(p, 'utf8');
const rel = p => path.relative(root, p).replace(/\\/g, '/');

const legacySemanticFiles = [
  'packages/cli/src/utils/incremental/fieldResolver.ts',
  'packages/cli/src/utils/incremental/modelAccessorResolver.ts',
  'packages/cli/src/utils/incremental/resourceResolver.ts',
  'packages/cli/src/utils/incremental/collectionCanonicalizer.ts'
];

const semanticSymbols = /(?:fieldResolver|modelAccessorResolver|resourceResolver|createFieldResolver|resolveModelAccessors|resolveResources|canonicalizeCollectionDescriptor)/;
const productionRefs = production
  .filter(p => !legacySemanticFiles.includes(rel(p)) && semanticSymbols.test(text(p)))
  .map(rel);

const helperState = legacySemanticFiles.map(p => ({
  path: p,
  exists: fs.existsSync(path.join(root, p)),
  bytes: fs.existsSync(path.join(root, p)) ? fs.statSync(path.join(root, p)).size : -1
}));

const incremental = text(path.join(cli, 'utils/incremental.ts'));
const legacyInvocation = /createFieldResolver|resolveModelAccessors|resolveResources|canonicalizeCollectionDescriptor/.test(incremental);
const coreRouteAuthority = /export type \{ RouteSemanticFlow \} from ['"]@routesync\/core['"]/.test(text(path.join(cli, 'utils/incremental/incrementalTypes.ts')));
const routeHelpersEmpty = [
  'packages/cli/src/utils/incremental/types/scannedRouteTypes.ts',
  'packages/cli/src/utils/incremental/routeHasher.ts',
  'packages/cli/src/utils/incremental/routeResolver.ts',
  'packages/cli/src/utils/incremental/routeResponseResolver.ts'
].every(p => fs.existsSync(path.join(root, p)) && fs.statSync(path.join(root, p)).size === 0);

const result = {
  phase: 834,
  semanticAuthority: 'packages/core/src/compiler/scanner/upstream/upstreamManifestBuilder.ts::constructRouteSyncManifest',
  coreRouteAuthority: coreRouteAuthority,
  legacyIncrementalSemanticProductionRefs: productionRefs,
  legacyIncrementalSemanticInvocation: legacyInvocation,
  preservedLegacySemanticFiles: helperState,
  preservedRouteHelpersEmpty: routeHelpersEmpty,
  semanticIncrementalIsolationClosed: productionRefs.length === 0 && !legacyInvocation,
  recommendation: 'Keep the legacy incremental semantic helpers preserved and empty. Migrate remaining CLI callers from the compatibility transport to the upstream RouteSyncManifest/sourceModel flow before removing the compatibility boundary.'
};

console.log(JSON.stringify(result, null, 2));
if (!result.semanticIncrementalIsolationClosed || !result.preservedRouteHelpersEmpty || !helperState.every(x => x.exists && x.bytes === 0)) process.exitCode = 1;
