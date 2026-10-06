const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const repo = path.resolve(root, '../..');
const core = path.join(root, 'src');
const upstream = path.join(core, 'types', 'upstream');
const compiler = path.join(core, 'compiler');
const cli = path.join(repo, 'packages', 'cli', 'src');
const ecommerce = path.join(repo, 'examples', 'ecommerce-shop-source');

function read(file) { return fs.readFileSync(file, 'utf8'); }
function files(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...files(p));
    else if (/\.(ts|cjs)$/.test(p)) out.push(p);
  }
  return out;
}
function productionTs(dir) {
  return files(dir).filter(f => !f.includes(`${path.sep}__tests__${path.sep}`) && !f.includes('.test.') && !f.includes('.spec.'));
}
function count(dir, pattern) { return productionTs(dir).filter(f => pattern.test(read(f))); }

const relationAuthority = read(path.join(upstream, 'semanticReferences.ts'));
const policyAuthority = read(path.join(upstream, 'controllerActionPolicyRelations.ts')) + '\n' + read(path.join(upstream, 'routeActionPolicyRelations.ts'));
const sourceModel = read(path.join(upstream, 'highLevelSourceModel.ts'));
const manifest = read(path.join(upstream, 'manifest.ts'));
const manifestWiring = read(path.join(compiler, 'scanner', 'orchestrator', 'upstreamManifestScanner.ts'));
const graph = read(path.join(core, 'graph', 'RouteSyncManifestGraphProjection.ts'));
const graphInterface = read(path.join(core, 'graph', 'RouteSyncManifestGraphProjectionInterface.ts'));
const dataflowAdapter = read(path.join(compiler, 'analysis', 'semanticDataflowDataFlowAdapter.ts'));
const dataflowInterface = read(path.join(core, 'types', 'dataflow', 'dataFlowInterface.ts'));
const dependencyBoundary = read(path.join(core, 'types', 'interfaces', 'interfaceDependencyBoundary.ts'));
const ir = read(path.join(compiler, 'ir', 'SemanticDataflowIRProjection.ts'));
const irInterface = read(path.join(compiler, 'ir', 'SemanticDataflowIRProjectionInterface.ts'));
const semanticDataflow = read(path.join(upstream, 'semanticDataflow.ts'));
const legacyRefs = count(path.join(core, 'scanner'), /StaticLaravelScanner|LaravelScanner/);
const cliCoreImports = productionTs(cli).filter(f => /from\s+['"][^'"]*(?:packages\/core\/src|\.\.\/\.\/core\/src)/.test(read(f)));

const structuralKinds = [
  'resource_model', 'model_relation', 'request_property', 'response_resource', 'response_model',
  'route_request', 'route_response', 'route_controller', 'controller_resource', 'controller_model',
  'controller_response', 'controller_dependency',
];
const policyKinds = [
  'controller_action_middleware_policy', 'controller_action_authorization_policy',
  'route_action_middleware_policy', 'route_action_authorization_policy',
];
const producerKinds = ['request', 'route', 'controller', 'resource'];

const checks = {
  allStructuralKindsCanonical: structuralKinds.every(k => new RegExp(`kind:\\s*'${k}'`).test(relationAuthority)),
  allPolicyKindsCanonical: policyKinds.every(k => new RegExp(`kind:\\s*'${k}'`).test(policyAuthority)),
  relationGraphConstructedOnce: /graph:\s*\{\s*kind:\s*'semantic_relation_graph',\s*relations:\s*sequenceFromArray\(relationValues\)/.test(sourceModel),
  manifestCarriesCanonicalRelations: /relations:\s*SemanticRelationGraph/.test(manifest) && /relations:\s*manifest\.sourceModel\.relations/.test(manifestWiring),
  graphCarriesCanonicalRelations: /relations:\s*manifest\.relations/.test(graph) && /relations:\s*SemanticRelationGraph/.test(graphInterface),
  dataflowLineageProducerClosed: /type SemanticDataflowLineageProducer = 'request' \| 'route' \| 'controller' \| 'resource'/.test(semanticDataflow) && /readonly closed: true/.test(semanticDataflow),
  dataflowSeedOnlyBuildsJudgment: /seed:\s*\(nextInput: SemanticDataflowInput\) => createSemanticDataflowJudgment\(nextInput\)/.test(dataflowAdapter),
  dataflowDeriveDoesNotRecompute: /derive:\s*\(current: SemanticDataflowJudgment\) => current/.test(dataflowAdapter),
  dataflowCloseDoesNotRecompute: /close:\s*\(current: SemanticDataflowJudgment\) => current/.test(dataflowAdapter),
  irReadsClosedState: /const facts = dataflow\.state\.closure/.test(ir) && !/createSemanticDataflowJudgment/.test(ir),
  irUsesDataflowBoundary: /DataFlowProjectionInterface<\s*SemanticDataflowInput,\s*SemanticDataflowJudgment,\s*SemanticDataflowIdentity,\s*SemanticDataflowIRProjection\s*>/.test(irInterface),
  genericDataFlowInterface: /DataFlowInterface<Input, State, Node>/.test(dataflowInterface) && !/Laravel|Route|Controller|Resource|Model/.test(dataflowInterface),
  genericDirectionalBoundary: /InterfaceDependencyBoundary<Upstream, Downstream>/.test(dependencyBoundary),
  noCompilerImportsIntoUpstream: count(upstream, /from\s+['"][^'"]*compiler\//).length === 0,
  legacyProductionEmpty: legacyRefs.length === 0,
  cliSurfaceOnly: cliCoreImports.length === 0,
  ecommerceFixturePresent: ['routes/api.php','routes/web.php','app/Http/Controllers/OrderController.php','app/Models/Order.php','app/Http/Resources/OrderResource.php','database/migrations','frontend/src/api/schemas'].every(p => fs.existsSync(path.join(ecommerce, p))),
};

const result = {
  phase: 1122,
  direction: 'upstream => wiring => interface => downstream',
  structuralKinds,
  policyKinds,
  dataflowProducers: producerKinds,
  checks,
  counts: {
    upstreamCompilerImports: count(upstream, /from\s+['"][^'"]*compiler\//).length,
    legacyRefs: legacyRefs.length,
    cliCoreImports: cliCoreImports.length,
  },
  violations: Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name),
};
result.passed = result.violations.length === 0;
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
