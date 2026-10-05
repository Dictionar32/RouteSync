const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const productionRoots = [path.join(root, 'packages', 'core', 'src'), path.join(root, 'packages', 'cli', 'src')];
const files = [];
const visit = dir => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) visit(full);
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name) && !/\.spec\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
};
productionRoots.forEach(visit);

const source = files.map(file => ({ file, text: fs.readFileSync(file, 'utf8') }));
const text = source.map(item => item.text).join('\n');
const refs = pattern => source.flatMap(item => pattern.test(item.text) ? [path.relative(root, item.file)] : []);

const patternFactory = /RouteSemanticFlowFactory/;
const cliSource = source.filter(item => item.file.includes(`${path.sep}packages${path.sep}cli${path.sep}commands${path.sep}`));
const cliText = cliSource.map(item => item.text).join('\n');
const cliRefs = pattern => cliSource.flatMap(item => pattern.test(item.text) ? [path.relative(root, item.file)] : []);
const coreFactoryRefs = source.flatMap(item => item.file.endsWith('RouteSemanticFlowFactory.ts') ? [] : patternFactory.test(item.text) ? [path.relative(root, item.file)] : []);

const result = {
  phase: 838,
  canonicalLowering: 'packages/core/src/compiler/scanner/upstream/routeManifestLowerer.ts',
  upstreamAuthority: 'RouteSyncManifest::sourceModel::contracts',
  routeBoundaryAuthority: 'routeProducerRelations::routeBoundaryContractFromRouteEmission',
  forbiddenCliLegacyBoundaryRefs: cliRefs(/resolveManifestIncrementally|manifest:\s*any|as unknown as RouteManifest/),
  legacyRouteFactoryProductionRefs: coreFactoryRefs,
  canonicalLoweringExported: text.includes('lowerRouteSyncManifestToRouteManifest'),
  canonicalBoundaryProjection: text.includes('routeBoundaryContractFromRouteEmission'),
  manifestGeneratorRemainsDownstream: text.includes('ManifestGenerator.generate'),
};
result.pass = result.forbiddenCliLegacyBoundaryRefs.length === 0 && result.legacyRouteFactoryProductionRefs.length === 0 && result.canonicalLoweringExported && result.canonicalBoundaryProjection;
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exit(1);
