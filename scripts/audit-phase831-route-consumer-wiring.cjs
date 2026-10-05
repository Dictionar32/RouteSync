const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const packagesRoot = path.join(root, 'packages');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function read(file) { return fs.readFileSync(file, 'utf8'); }
function rel(file) { return path.relative(root, file).replaceAll(path.sep, '/'); }

const files = walk(packagesRoot);
const production = files.filter(file => !/(^|\/)tests?(\/|$)|(__tests__|\.spec\.|\.test\.)/.test(rel(file)));

const coreFactory = 'RouteSemanticFlowFactory';
const cliFactoryFile = 'packages/cli/src/utils/incremental/descriptors/scannedRouteDescriptor.ts';
const cliFactoryRefs = [];
const coreFactoryRefs = [];
const legacyRouteTypeRefs = [];

for (const file of production) {
  const text = read(file);
  if (text.includes(coreFactory)) {
    const item = rel(file);
    if (item === cliFactoryFile) coreFactoryRefs.push(item);
    else cliFactoryRefs.push(item);
  }
  if (text.includes('RouteSemanticFlowLegacy') || /RouteSemanticFlow\s*=\s*RouteSemanticFlowLegacy/.test(text)) {
    legacyRouteTypeRefs.push(rel(file));
  }
}

const cliFactoryImplementation = fs.existsSync(path.join(root, cliFactoryFile))
  ? read(path.join(root, cliFactoryFile))
  : null;

const canonicalProducer = path.join(root, 'packages/core/src/compiler/scanner/subscanners/routeProducer.ts');
const canonicalRelations = path.join(root, 'packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const canonicalProducerText = read(canonicalProducer);
const canonicalRelationsText = read(canonicalRelations);

const preservedLegacyFactoryFiles = [
  'packages/core/src/compiler/scanner/descriptors/route/factories/syntheticRouteFactory.ts',
  'packages/core/src/compiler/scanner/descriptors/route/factories/index.ts',
  'packages/core/src/compiler/scanner/descriptors/route/factories/contractRouteFactories.ts',
  'packages/core/src/compiler/scanner/descriptors/route/factories/closureRouteFactory.ts',
  'packages/core/src/compiler/scanner/descriptors/route/factories/controllerActionRouteFactory.ts',
  'packages/core/src/compiler/scanner/descriptors/route/factories/closureSyntheticFactories.ts',
  'packages/core/src/compiler/scanner/descriptors/route/factories/controllerReferenceRouteFactory.ts',
  'packages/core/src/compiler/scanner/descriptors/route/factories/actionRouteFactories.ts',
  'packages/core/src/compiler/scanner/descriptors/route/factories/routeMutations.ts'
];

const preservedLegacyStatus = preservedLegacyFactoryFiles.map(file => {
  const full = path.join(root, file);
  return { file, exists: fs.existsSync(full), empty: fs.existsSync(full) && fs.statSync(full).size === 0 };
});

const result = {
  phase: 831,
  correctedExtensionMatcher: true,
  productionTypeScriptFileCount: production.length,
  cliDuplicateFactoryImplementation: cliFactoryImplementation !== null && cliFactoryImplementation.trim().length > 0,
  productionRouteSemanticFlowFactoryReferences: coreFactoryRefs,
  productionLegacyRouteTypeReferences: legacyRouteTypeRefs,
  canonicalProducerReferenceCount: (canonicalProducerText.match(/route_ast/g) || []).length,
  canonicalRelationUsesBoundaryFactory: canonicalRelationsText.includes('RouteBoundaryContractFactory'),
  canonicalRelationUsesLegacyFactory: canonicalRelationsText.includes('RouteSemanticFlowFactory'),
  canonicalRelationUsesLegacyFlow: canonicalRelationsText.includes('RouteSemanticFlow'),
  preservedLegacyFactoryStatus: preservedLegacyStatus,
  nextFrontier: 'wire CLI incremental route state to existing core RouteSemanticFlow/RouteAst authority; do not create a second CLI route producer'
};

console.log(JSON.stringify(result, null, 2));
