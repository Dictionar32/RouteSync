const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const core = path.join(root, 'packages/core/src');
const sdk = path.join(root, 'packages/sdk/tests');
const legacyFactoryDir = path.join(core, 'compiler/scanner/descriptors/route/factories');
const preservedLegacyFiles = [
  'syntheticRouteFactory.ts',
  'index.ts',
  'contractRouteFactories.ts',
  'closureRouteFactory.ts',
  'controllerActionRouteFactory.ts',
  'closureSyntheticFactories.ts',
  'controllerReferenceRouteFactory.ts',
  'actionRouteFactories.ts',
];

const walk = dir => fs.existsSync(dir)
  ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
    )
  : [];
const relative = file => path.relative(root, file).replaceAll(path.sep, '/');
const read = file => fs.readFileSync(file, 'utf8');

const coreFiles = walk(core).filter(file => file.endsWith('.ts'));
const sdkFiles = walk(sdk).filter(file => file.endsWith('.ts'));
const factoryFiles = preservedLegacyFiles.map(file => path.join(legacyFactoryDir, file));
const missingLegacyFiles = factoryFiles.filter(file => !fs.existsSync(file)).map(relative);
const nonEmptyLegacyFiles = factoryFiles
  .filter(file => fs.existsSync(file) && fs.statSync(file).size !== 0)
  .map(relative);

const legacyImportPatterns = /(?:descriptors[\\/]route[\\/]factories|routeSemanticFactories|routeMutations)/;
const productionLegacyRefs = coreFiles
  .filter(file => legacyImportPatterns.test(read(file)))
  .map(relative);
const sdkLegacyRefs = sdkFiles
  .filter(file => legacyImportPatterns.test(read(file)))
  .map(relative);

const routeFactoryRefs = coreFiles
  .filter(file => /RouteSemanticFlowFactory/.test(read(file)))
  .map(relative);
const sdkRouteFactoryConsumers = sdkFiles
  .filter(file => /RouteSemanticFlowFactory/.test(read(file)))
  .map(relative);

const producerPath = path.join(core, 'compiler/scanner/subscanners/routeProducerRelations.ts');
const producerText = read(producerPath);
const canonicalWiring = [
  'RouteBoundaryContractFactory.create',
  'RouteProducerInput',
  'routeProducer.produce'
].every(fragment => producerText.includes(fragment));

const producerConstructsRouteAst = producerText.includes('routeProducer.produce(producerInput)');
const directRouteAstConstructors = coreFiles
  .filter(file => file !== path.join(core, 'compiler/scanner/subscanners/routeProducer.ts'))
  .filter(file => /createDomainAstJudgment\(\{[\s\S]*?kind:\s*[\"']route_ast[\"']/.test(read(file)))
  .map(relative);

const routeMutationsPath = path.join(core, 'compiler/scanner/descriptors/route/routeMutations.ts');
const routeMutationsEmpty = fs.existsSync(routeMutationsPath) && fs.statSync(routeMutationsPath).size === 0;

const report = {
  phase: 826,
  preservedLegacyFiles: {
    directoryExists: fs.existsSync(legacyFactoryDir),
    expectedFiles: preservedLegacyFiles.map(file => `packages/core/src/compiler/scanner/descriptors/route/factories/${file}`),
    missing: missingLegacyFiles,
    nonEmpty: nonEmptyLegacyFiles,
    allPreservedAndEmpty: missingLegacyFiles.length === 0 && nonEmptyLegacyFiles.length === 0,
  },
  preservedLegacyRouteMutations: {
    exists: fs.existsSync(routeMutationsPath),
    empty: routeMutationsEmpty,
  },
  legacyDependencyGraph: {
    productionReferences: productionLegacyRefs,
    sdkReferences: sdkLegacyRefs,
    productionReachabilityZero: productionLegacyRefs.length === 0,
  },
  legacyFactoryConsumers: {
    coreReferences: routeFactoryRefs,
    sdkTests: sdkRouteFactoryConsumers,
    sdkTestCount: sdkRouteFactoryConsumers.length,
  },
  canonicalRoutePath: {
    routeProducerRelationsWired: canonicalWiring,
    routeAstProducedByCanonicalProducer: producerConstructsRouteAst,
    directRouteAstConstructorsOutsideProducer: directRouteAstConstructors,
  },
  nextFrontier: 'wire SDK tests that still exercise RouteSemanticFlowFactory to existing RouteBoundaryContractFactory/RouteProducerInput/RouteAst authorities, one test contract at a time; preserve legacy files empty until reachability is proven zero',
};

console.log(JSON.stringify(report, null, 2));

if (!report.preservedLegacyFiles.allPreservedAndEmpty ||
    !report.preservedLegacyRouteMutations.empty ||
    !report.legacyDependencyGraph.productionReachabilityZero ||
    !report.canonicalRoutePath.routeProducerRelationsWired ||
    !report.canonicalRoutePath.routeAstProducedByCanonicalProducer ||
    report.canonicalRoutePath.directRouteAstConstructorsOutsideProducer.length !== 0) {
  process.exitCode = 1;
}
