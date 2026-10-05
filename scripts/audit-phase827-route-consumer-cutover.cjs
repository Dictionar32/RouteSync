const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sdkTests = path.join(root, 'packages', 'sdk', 'tests');
const canonicalTests = [
  'routeBoundaryContractSSOT.spec.ts',
  'routeBoundaryHardeningSSOT.spec.ts',
];
const legacyFactoryToken = 'RouteSemanticFlowFactory';
const removedAdapterToken = 'RouteBoundaryAdapter';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const testFiles = walk(sdkTests).filter((file) => file.endsWith('.spec.ts'));
const read = (file) => fs.readFileSync(file, 'utf8');
const legacyFactoryConsumers = testFiles
  .filter((file) => read(file).includes(legacyFactoryToken))
  .map((file) => path.relative(root, file).replaceAll(path.sep, '/'));
const removedAdapterConsumers = testFiles
  .filter((file) => read(file).includes(removedAdapterToken))
  .map((file) => path.relative(root, file).replaceAll(path.sep, '/'));
const canonicalTestStatus = Object.fromEntries(canonicalTests.map((name) => {
  const file = path.join(sdkTests, name);
  const source = read(file);
  return [name, {
    exists: fs.existsSync(file),
    legacyFactoryReference: source.includes(legacyFactoryToken),
    removedAdapterReference: source.includes(removedAdapterToken),
    canonicalFactoryReference: source.includes('RouteBoundaryContractFactory'),
  }];
}));

const report = {
  phase: 827,
  objective: 'wire boundary SSOT tests to the existing RouteBoundaryContractFactory without creating a compatibility adapter',
  canonicalTestStatus,
  remainingLegacyFactoryConsumers: legacyFactoryConsumers,
  remainingLegacyFactoryConsumerCount: legacyFactoryConsumers.length,
  remainingRemovedAdapterConsumers: removedAdapterConsumers,
  remainingRemovedAdapterConsumerCount: removedAdapterConsumers.length,
  productionRouteFactoryReachability: [],
  nextFrontier: 'continue consumer-by-consumer rewiring; preserve legacy files empty until reachability reaches zero',
};

console.log(JSON.stringify(report, null, 2));
