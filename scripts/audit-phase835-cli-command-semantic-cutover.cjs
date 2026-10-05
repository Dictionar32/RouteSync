const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));

const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const incremental = read('packages/cli/src/utils/incremental.ts');

const legacySemanticConstruction = [
  'SemanticKernelV2Impl',
  'kernel.loadGraph',
  'createFieldResolver',
  'resolveModelAccessors',
  'resolveResources',
  'canonicalizeCollectionDescriptor'
];

const commandLegacyConstructionRefs = legacySemanticConstruction.filter(symbol =>
  scan.includes(symbol) || sync.includes(symbol)
);

const incrementalIsTransportOnly =
  incremental.includes('Compatibility transport only') &&
  incremental.includes('Do not clone, normalize, resolve, or rebuild semantic data') &&
  !incremental.includes('resolveResources(') &&
  !incremental.includes('resolveModelAccessors(') &&
  !incremental.includes('createFieldResolver(');

const result = {
  phase: 835,
  canonicalUpstreamAuthority: 'packages/core/src/compiler/scanner/upstream/upstreamManifestBuilder.ts::constructRouteSyncManifest',
  commandFiles: [
    'packages/cli/src/commands/scan.ts',
    'packages/cli/src/commands/sync.ts'
  ],
  commandLegacySemanticConstructionRefs: commandLegacyConstructionRefs,
  incrementalBoundaryIsTransportOnly: incrementalIsTransportOnly,
  legacyRouteHelpersRemainPreserved: [
    'packages/cli/src/utils/incremental/types/scannedRouteTypes.ts',
    'packages/cli/src/utils/incremental/routeHasher.ts',
    'packages/cli/src/utils/incremental/routeResolver.ts',
    'packages/cli/src/utils/incremental/routeResponseResolver.ts'
  ].every(exists),
  compatibilityBoundaryStillReachable: true,
  nextFrontier: 'Replace CLI RouteManifest compatibility transport with an existing upstream-to-generator contract boundary; do not create a second semantic resolver.'
};

console.log(JSON.stringify(result, null, 2));
if (result.commandLegacySemanticConstructionRefs.length !== 0 || !result.incrementalBoundaryIsTransportOnly || !result.legacyRouteHelpersRemainPreserved) {
  process.exitCode = 1;
}
