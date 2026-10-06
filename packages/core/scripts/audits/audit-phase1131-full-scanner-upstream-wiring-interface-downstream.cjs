const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const repo = path.resolve(root, '../..');
const coreSrc = path.join(root, 'src');
const cliSrc = path.join(repo, 'packages/cli/src');
const upstream = path.join(coreSrc, 'types/upstream');

const read = p => fs.readFileSync(p, 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const walk = dir => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
};
const ts = dir => walk(dir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

const upstreamFiles = ts(upstream);
const upstreamCompilerImports = upstreamFiles.filter(f => /compiler\//.test(read(f)));

const requiredUpstreamTypes = {
  application: 'src/types/upstream/application.ts',
  channel: 'src/types/upstream/channel.ts',
  controller: 'src/types/upstream/controller.ts',
  migration: 'src/types/upstream/migration.ts',
  model: 'src/types/upstream/model.ts',
  modelRelation: 'src/types/upstream/modelRelation.ts',
  request: 'src/types/upstream/request.ts',
  response: 'src/types/upstream/response.ts',
  resource: 'src/types/upstream/resource.ts',
  route: 'src/types/upstream/route.ts',
  schema: 'src/types/upstream/schema.ts',
  service: 'src/types/upstream/service.ts',
  manifest: 'src/types/upstream/manifest.ts',
  semanticReferences: 'src/types/upstream/semanticReferences.ts',
  highLevelSourceModel: 'src/types/upstream/highLevelSourceModel.ts',
  sourceProjectIdentity: 'src/types/upstream/sourceProjectIdentity.ts',
  semanticDataflow: 'src/types/upstream/semanticDataflow.ts',
};
const missingUpstreamTypes = Object.entries(requiredUpstreamTypes)
  .filter(([, p]) => !exists(p))
  .map(([name]) => name);

const sourceAstScanner = read(path.join(coreSrc, 'compiler/scanner/orchestrator/sourceAstScanner.ts'));
const scannerSurfaceTokens = [
  'ChannelScanner', 'ControllerScanner', 'FormRequestScanner', 'ModelScanner', 'ResourceScanner', 'RouteScanner',
  'scanResponseBundle', 'scanMigrationAsts', 'scanServiceBundle', 'scanMiddlewareAsts', 'scanDtoAsts',
  'scanProviderBundle', 'scanAttributeAsts', 'schemaProducer', 'queryProducer',
];
const missingScannerSurfaceTokens = scannerSurfaceTokens.filter(token => !sourceAstScanner.includes(token));

const sourceModel = read(path.join(upstream, 'highLevelSourceModel.ts'));
const sourceModelDomains = ['controllers', 'providers', 'models', 'resources', 'requests', 'responses', 'services', 'routes', 'channels'];
const missingSourceModelDomains = sourceModelDomains.filter(token => !new RegExp(`readonly ${token}:`).test(sourceModel));

const semanticRefs = read(path.join(upstream, 'semanticReferences.ts'));
const relationKinds = [
  'resource_model', 'model_relation', 'request_property', 'response_resource', 'response_model',
  'route_request', 'route_response', 'route_controller', 'controller_resource', 'controller_model',
  'controller_response', 'controller_dependency',
];
const missingRelationKinds = relationKinds.filter(kind => !semanticRefs.includes(`kind: '${kind}'`));

const manifest = read(path.join(upstream, 'manifest.ts'));
const manifestBoundary = {
  flowHasRelations: /readonly relations: SemanticRelationGraph/.test(manifest),
  flowHasDataflowInputs: /readonly dataflowInputs:/.test(manifest),
  flowHasNoAst: !(() => { const start = manifest.indexOf('export interface RouteSyncManifestFlow'); const end = manifest.indexOf('export interface RouteSyncManifest', start + 1); return start >= 0 && end > start && /readonly ast:/.test(manifest.slice(start, end)); })(),
  constructionManifestHasAst: /interface RouteSyncManifest[\s\S]*?readonly ast: CompleteSourceAst/.test(manifest),
};

const dataflow = read(path.join(coreSrc, 'types/dataflow/dataFlowInterface.ts'));
const dependencyBoundary = read(path.join(coreSrc, 'types/interfaces/interfaceDependencyBoundary.ts'));
const forbiddenDomainVocabulary = /Laravel|Route|Controller|Request|Model|Resource|Schema|Graph|IR|StaticLaravelScanner/;

const legacyProductionFiles = ts(coreSrc).filter(f => !f.includes(`${path.sep}types${path.sep}upstream${path.sep}`) && /StaticLaravelScanner|class\s+LaravelScanner/.test(read(f)));
const cliDirectCoreSourceImports = ts(cliSrc).filter(f => /@routesync\/core\/src|packages\/core\/src/.test(read(f)));

const commandFiles = ts(path.join(cliSrc, 'commands'));
const commandSource = commandFiles.map(read).join('\n');
const commandUsesPackageSurface = /@routesync\/core/.test(commandSource);

const flowProjection = read(path.join(coreSrc, 'compiler/scanner/orchestrator/upstreamManifestScanner.ts'));
const graphProjection = read(path.join(coreSrc, 'compiler/scanner/wiring/routeManifestProjection.ts'));
const dataflowProjection = read(path.join(coreSrc, 'types/upstream/semanticDataflowManifestSurface.ts'));
const downstreamConcreteManifestImports = [flowProjection, graphProjection, dataflowProjection].some(text => /CompleteSourceAst|manifest\.ast/.test(text));

const ecommerce = path.join(repo, 'examples/ecommerce-shop-source');
const ecommerceRequired = ['routes/api.php', 'routes/web.php', 'app/Http/Controllers', 'app/Models', 'app/Http/Resources', 'database/migrations'];
const missingEcommerce = ecommerceRequired.filter(p => !fs.existsSync(path.join(ecommerce, p)));

const checks = {
  fullUpstreamTypeSurface: missingUpstreamTypes.length === 0,
  upstreamDoesNotImportCompiler: upstreamCompilerImports.length === 0,
  scannerCoversBroadSourceSurface: missingScannerSurfaceTokens.length === 0,
  sourceModelCarriesBroadDomainCatalog: missingSourceModelDomains.length === 0,
  canonicalStructuralRelationVocabularyComplete: missingRelationKinds.length === 0,
  manifestFlowIsAstFreeAndConstructionManifestOwnsAst: manifestBoundary.flowHasRelations && manifestBoundary.flowHasDataflowInputs && manifestBoundary.flowHasNoAst && manifestBoundary.constructionManifestHasAst,
  dataFlowInterfaceDomainNeutral: !forbiddenDomainVocabulary.test(dataflow),
  dependencyBoundaryGeneric: !forbiddenDomainVocabulary.test(dependencyBoundary) && /InterfaceDependencyBoundary<Upstream, Downstream>/.test(dependencyBoundary),
  legacyScannerProductionAbsent: legacyProductionFiles.length === 0,
  cliUsesPackageSurface: cliDirectCoreSourceImports.length === 0 && commandUsesPackageSurface,
  downstreamDoesNotReachConstructionManifest: !downstreamConcreteManifestImports,
  ecommerceFixturePresent: missingEcommerce.length === 0,
};

const result = {
  phase: 1131,
  direction: 'upstream => wiring => interface => downstream',
  scannerScope: {
    scanner: ['route', 'controller', 'model', 'resource', 'request', 'response', 'service', 'provider', 'channel', 'migration', 'middleware', 'dto', 'attribute', 'schema', 'query', 'expression', 'assignment', 'property'],
    sourceModel: sourceModelDomains,
    runtimeDataflowProducers: ['request', 'route', 'controller', 'resource'],
    structuralOnlyEvidence: ['model_relation', 'schema'],
  },
  checks,
  violations: {
    missingUpstreamTypes,
    upstreamCompilerImports: upstreamCompilerImports.map(f => path.relative(repo, f)),
    missingScannerSurfaceTokens,
    missingSourceModelDomains,
    missingRelationKinds,
    manifestBoundary,
    legacyProductionFiles: legacyProductionFiles.map(f => path.relative(repo, f)),
    cliDirectCoreSourceImports: cliDirectCoreSourceImports.map(f => path.relative(repo, f)),
    downstreamConcreteManifestImports,
    missingEcommerce,
  },
};

result.passed = Object.values(checks).every(Boolean);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.passed ? 0 : 1;
