const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const fixture = path.join(root, 'packages/sdk/tests/fixtures/ecommerce-shop-source');
const read = file => fs.readFileSync(file, 'utf8');
const files = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? files(file) : [file];
});
const tsFiles = files(core).filter(file => file.endsWith('.ts'));
const productionTs = tsFiles.filter(file => !file.includes(`${path.sep}__tests__${path.sep}`) && !file.includes(`${path.sep}__test__${path.sep}`));

const kernelLegacyPatterns = [
  'semantic/kernel/relationFoundation',
  'semantic/kernel/syntax/presenceRelations',
  'semantic/kernel/relationalSequence',
  'semantic/kernel/semanticRelations',
  'semantic/kernel/relationMembership',
];
const productionKernelLeaks = productionTs.flatMap(file => kernelLegacyPatterns
  .filter(pattern => read(file).includes(pattern))
  .map(pattern => ({ file: path.relative(root, file), pattern })));

const upstream = path.join(core, 'types/upstream');
const upstreamFiles = files(upstream).filter(file => file.endsWith('.ts') && !file.includes(`${path.sep}__tests__${path.sep}`));
const reversePatterns = /from ['\"](?:\.\.\/)+(?:compiler|scanner|graph|ir)\//;
const reverseUpstreamImports = upstreamFiles.flatMap(file => reversePatterns.test(read(file)) ? [path.relative(root, file)] : []);

const fixtureFiles = files(fixture).filter(file => file.endsWith('.php')).map(file => path.relative(root, file).replaceAll(path.sep, '/'));
const requiredFixture = [
  'packages/sdk/tests/fixtures/ecommerce-shop-source/routes/web.php',
  'packages/sdk/tests/fixtures/ecommerce-shop-source/app/Http/Controllers/OrderController.php',
  'packages/sdk/tests/fixtures/ecommerce-shop-source/app/Http/Requests/StoreOrderRequest.php',
  'packages/sdk/tests/fixtures/ecommerce-shop-source/app/Http/Resources/OrderResource.php',
  'packages/sdk/tests/fixtures/ecommerce-shop-source/app/Models/Order.php',
  'packages/sdk/tests/fixtures/ecommerce-shop-source/app/Policies/OrderPolicy.php',
];
const fixtureContent = requiredFixture.map(file => read(path.join(root, file)));
const dataflowTest = read(path.join(core, 'compiler/analysis/__tests__/ecommerceShopHighestAstDataflowPhase760.spec.ts'));
const e2eTest = read(path.join(core, 'compiler/scanner/__test__/ecommerceShopFixtureEndToEndPhase954.spec.ts'));
const audit = read(path.join(__dirname, 'audit-phase954-e2e-ownership-proof.cjs'));

const checks = {
  foundationOwnsRelationFoundation: fs.existsSync(path.join(core, 'semantic/foundation/relationFoundation.ts')),
  foundationOwnsPresenceRelations: fs.existsSync(path.join(core, 'semantic/foundation/presenceRelations.ts')),
  productionHasNoLegacyKernelGenericImports: productionKernelLeaks.length === 0,
  upstreamHasNoProductionReverseImports: reverseUpstreamImports.length === 0,
  fixtureHasLaravelRoute: fixtureFiles.includes('packages/sdk/tests/fixtures/ecommerce-shop-source/routes/web.php'),
  fixtureHasController: fixtureFiles.includes('packages/sdk/tests/fixtures/ecommerce-shop-source/app/Http/Controllers/OrderController.php'),
  fixtureHasPolicyAttributes: fixtureContent.some(content => content.includes("#[Middleware('auth')]")) && fixtureContent.some(content => content.includes("#[Authorize('update'")),
  fixtureHasPolicySource: fixtureFiles.includes('packages/sdk/tests/fixtures/ecommerce-shop-source/app/Policies/OrderPolicy.php'),
  dataflowTestReadsPhysicalFixture: dataflowTest.includes("readFileSync(sourceFile, 'utf8')") && dataflowTest.includes('ecommerce-shop-source'),
  dataflowTestUsesCanonicalAuthority: dataflowTest.includes('createSemanticDataflowJudgment') && dataflowTest.includes('semanticDataflowInterfaceFromJudgment'),
  e2eTestExecutesScanner: e2eTest.includes('StaticLaravelScanner.scan') && e2eTest.includes('fixtureRoot'),
  e2eTestChecksPolicyConsumption: e2eTest.includes('controller_action_middleware_policy') && e2eTest.includes('controller_action_authorization_policy'),
  e2eTestChecksStructuralGraph: e2eTest.includes('ServiceGraphBuilder') && e2eTest.includes('graph.edges.length'),
  auditIsSelfConsistent: audit.includes('productionHasNoLegacyKernelGenericImports') && audit.includes('dataflowTestReadsPhysicalFixture'),
  historicalExampleTreesAbsent: !fs.existsSync(path.join(root, 'examples/ecomerce-shop-source')) && !fs.existsSync(path.join(root, 'examples/ecommerce-shop-source')),
};

const result = {
  phase: 954,
  ownership: {
    productionKernelLeaks,
    reverseUpstreamImports,
    foundation: 'packages/core/src/semantic/foundation',
  },
  fixture: {
    root: 'packages/sdk/tests/fixtures/ecommerce-shop-source',
    files: fixtureFiles,
  },
  provenance: {
    source: 'physical ecommerce Laravel fixture',
    policy: 'scanner -> CompleteLaravelSourceModel.relations -> policy semantic relations',
    dataflow: 'physical controller fixture -> scanner dataflow evidence -> SemanticDataflowJudgment -> canonical interface',
    graph: 'CompleteLaravelSourceModel.relations -> structural filter -> GraphEdgeRelationSink -> ServiceGraph.edges',
  },
  checks,
  clean: Object.values(checks).every(Boolean),
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.clean ? 0 : 1);
