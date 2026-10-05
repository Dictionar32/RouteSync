const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx|js|cjs|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}
function refs(dir, needle) {
  return walk(dir).filter(f => fs.readFileSync(f, 'utf8').includes(needle))
    .map(f => path.relative(root, f).replaceAll('\\', '/'));
}
const publicFiles = [
  'packages/core/src/index.ts',
  'packages/core/src/compiler/index.ts',
  'packages/core/src/compiler/scanner/scannerExports.ts',
  'packages/core/src/compiler/scanner/descriptors/index.ts',
  'packages/core/src/compiler/scanner/descriptors/routeDescriptors.ts',
  'packages/core/src/compiler/scanner/descriptors/route/index.ts'
];
const publicLeaks = publicFiles.filter(f => fs.existsSync(path.join(root, f)) && fs.readFileSync(path.join(root, f), 'utf8').includes('RouteSemanticFlowFactory'));
const coreRefs = refs(path.join(root, 'packages/core/src'), 'RouteSemanticFlowFactory');
const sdkRefs = refs(path.join(root, 'packages/sdk/tests'), 'RouteSemanticFlowFactory');
const sdkDirectImports = sdkRefs.filter(f => fs.readFileSync(path.join(root, f), 'utf8').includes("../../core/src/compiler/scanner/descriptors/route/RouteSemanticFlowFactory"));
const nonLegacyCoreConsumers = coreRefs.filter(f =>
  !f.endsWith('/RouteSemanticFlowFactory.ts') &&
  !f.endsWith('/routeSemanticFactories.ts') &&
  !f.endsWith('/routeMutations.ts') &&
  !f.includes('/descriptors/route/factories/')
);
console.log(JSON.stringify({
  phase: 822,
  publicFactoryLeaks: publicLeaks,
  publicFactoryIsolated: publicLeaks.length === 0,
  coreLegacyFactoryReferenceFiles: coreRefs.length,
  nonLegacyCoreConsumers,
  sdkFactoryReferenceFiles: sdkRefs.length,
  sdkDirectLegacyImports: sdkDirectImports.length,
  sdkImportsIsolatedFromPublicBarrel: sdkRefs.length === sdkDirectImports.length,
  legacyIsland: [
    'RouteSemanticFlowFactory.ts',
    'routeSemanticFactories.ts',
    'routeMutations.ts',
    'route/factories/*'
  ],
  nextFrontier: sdkRefs.length === 0
    ? 'delete legacy route factory tree and re-audit RouteSemanticFlow consumers'
    : 'migrate SDK legacy factory fixtures to canonical RouteBoundaryContract/RouteAst semantics before deleting the legacy island'
}, null, 2));
