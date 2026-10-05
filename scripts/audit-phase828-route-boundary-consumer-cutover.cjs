const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sdkTests = path.join(root, 'packages', 'sdk', 'tests');
const core = path.join(root, 'packages', 'core', 'src');

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});
const read = (file) => fs.readFileSync(file, 'utf8');
const tests = walk(sdkTests).filter((file) => file.endsWith('.ts'));
const factoryConsumerFiles = tests.filter((file) => read(file).includes('RouteSemanticFlowFactory'));
const adapterConsumerFiles = [...walk(root)].filter((file) => /\.(ts|tsx|js|cjs|mjs)$/.test(file)).filter((file) => !file.includes(path.join('scripts', 'audit-'))).filter((file) => read(file).includes('RouteBoundaryAdapter'));
const legacyFactoryFiles = [
  'syntheticRouteFactory.ts', 'index.ts', 'contractRouteFactories.ts', 'closureRouteFactory.ts',
  'controllerActionRouteFactory.ts', 'closureSyntheticFactories.ts', 'controllerReferenceRouteFactory.ts',
  'actionRouteFactories.ts'
].map((name) => path.join(core, 'compiler', 'scanner', 'descriptors', 'route', 'factories', name));

const routeMutationsFile = path.join(core, 'compiler', 'scanner', 'descriptors', 'route', 'routeMutations.ts');
const legacyState = [...legacyFactoryFiles, routeMutationsFile].map((file) => ({
  file: path.relative(root, file),
  exists: fs.existsSync(file),
  empty: fs.existsSync(file) ? fs.statSync(file).size === 0 : false,
}));

const result = {
  phase: 828,
  boundaryAdapterConsumerFiles: adapterConsumerFiles.map((file) => path.relative(root, file)),
  boundaryAdapterConsumerCount: adapterConsumerFiles.length,
  routeSemanticFlowFactoryConsumerFiles: factoryConsumerFiles.map((file) => path.relative(root, file)),
  routeSemanticFlowFactoryConsumerCount: factoryConsumerFiles.length,
  preservedLegacyFactoryFiles: legacyState,
  allPreservedLegacyFactoryFilesEmpty: legacyState.every((item) => item.exists && item.empty),
  canonicalBoundaryFactoryPresent: fs.existsSync(path.join(core, 'compiler', 'scanner', 'resolvers', 'boundary', 'boundaryContractFactory.ts')),
  nextFrontier: adapterConsumerFiles.length === 0
    ? 'classify remaining RouteSemanticFlowFactory SDK consumers by canonical authority'
    : 'remove remaining RouteBoundaryAdapter SDK consumers via RouteBoundaryContractFactory'
};
console.log(JSON.stringify(result, null, 2));
