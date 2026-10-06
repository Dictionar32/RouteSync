const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const repo = path.resolve(root, '../..');
const core = path.join(root, 'src');
const upstream = path.join(core, 'types', 'upstream');
const domain = path.join(core, 'types', 'domain');
const semantic = path.join(core, 'semantic');
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
    else if (p.endsWith('.ts') || p.endsWith('.cjs')) out.push(p);
  }
  return out;
}
function productionTs(dir) {
  return files(dir).filter(f => !f.includes(`${path.sep}__tests__${path.sep}`) && !f.includes('.test.') && !f.includes('.spec.'));
}
function has(text, pattern) { return pattern.test(text); }
function refs(dir, pattern) {
  return productionTs(dir).filter(f => pattern.test(read(f)));
}

const semanticReferences = path.join(upstream, 'semanticReferences.ts');
const highLevelSourceModel = path.join(upstream, 'highLevelSourceModel.ts');
const manifest = path.join(upstream, 'manifest.ts');
const flowProjection = path.join(compiler, 'scanner', 'orchestrator', 'upstreamManifestScanner.ts');
const graphProjection = path.join(core, 'graph', 'RouteSyncManifestGraphProjection.ts');
const graphInterface = path.join(core, 'graph', 'RouteSyncManifestGraphProjectionInterface.ts');
const dataflowInterface = path.join(compiler, 'analysis', 'routeSyncManifestDataflowProjectionInterface.ts');
const dataflowCoreInterface = path.join(core, 'types', 'dataflow', 'dataFlowInterface.ts');
const dependencyBoundary = path.join(upstream, '..', 'interfaces', 'interfaceDependencyBoundary.ts');

const relationKinds = [
  'route_controller',
  'controller_model',
  'model_relation',
  'controller_resource',
  'response_resource',
  'resource_model',
  'route_request',
  'route_response',
];

const sr = read(semanticReferences);
const hl = read(highLevelSourceModel);
const mf = read(manifest);
const fp = read(flowProjection);
const gp = read(graphProjection);
const gi = read(graphInterface);
const dfi = read(dataflowInterface);
const dfiCore = read(dataflowCoreInterface);
const idb = read(dependencyBoundary);

const compilerStructuralDefinitions = refs(compiler, /export\s+(?:type|interface)\s+(?:StructuralSemanticRelation|SemanticRelationGraph|SemanticRelation)\b/);
const domainCompilerImports = refs(domain, /from\s+['"][^'"]*compiler\//);
const semanticCompilerImports = refs(semantic, /from\s+['"][^'"]*compiler\//);
const upstreamCompilerImports = refs(upstream, /from\s+['"][^'"]*compiler\//);
const legacyRefs = refs(path.join(core, 'scanner'), /StaticLaravelScanner|LaravelScanner/);
const cliCoreSourceImports = files(cli).filter(f => !f.includes(`${path.sep}__tests__${path.sep}`)).filter(f => /from\s+['"][^'"]*(?:packages\/core\/src|\.\.\/\.\/core\/src)/.test(read(f)));

const fixtureRequired = [
  'routes/api.php',
  'routes/web.php',
  'app/Http/Controllers/OrderController.php',
  'app/Models/Order.php',
  'app/Http/Resources/OrderResource.php',
  'database/migrations',
  'frontend/src/api/schemas',
];
const fixtureMissing = fixtureRequired.filter(rel => !fs.existsSync(path.join(ecommerce, rel)));

const checks = {
  canonicalRelationUnionUpstream: has(sr, /export\s+type\s+StructuralSemanticRelation\s*=\s*[\s\S]*export\s+type\s+SemanticRelation\s*=/),
  requiredRelationKindsCanonical: relationKinds.every(kind => new RegExp(String.raw`kind:\s*'${kind}'`).test(sr)),
  relationGraphBuiltOnceFromSourceModel: /graph:\s*\{\s*kind:\s*'semantic_relation_graph',\s*relations:\s*sequenceFromArray\(relationValues\)/.test(hl),
  relationGraphCarriedByManifestFlow: /relations:\s*SemanticRelationGraph/.test(mf) && /relations:\s*manifest\.sourceModel\.relations/.test(fp),
  graphPreservesCanonicalRelationGraph: /relations:\s*manifest\.relations/.test(gp),
  compilerDoesNotDefineStructuralRelationAlgebra: compilerStructuralDefinitions.length === 0,
  upstreamNoCompilerImports: upstreamCompilerImports.length === 0,
  domainNoCompilerImports: domainCompilerImports.length === 0,
  semanticNoCompilerImports: semanticCompilerImports.length === 0,
  legacyProductionEmpty: legacyRefs.length === 0,
  cliPackageSurfaceOnly: cliCoreSourceImports.length === 0,
  dataFlowInterfaceGeneric: /DataFlowInterface<Input, State, Node>/.test(dfiCore) && !/Laravel|Route|Controller|Resource|Model/.test(dfiCore),
  dependencyBoundaryDirectionalGeneric: /InterfaceDependencyBoundary<Upstream, Downstream>/.test(idb),
  graphBoundaryUsesInterface: /InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestGraphSurface>/.test(gi),
  dataflowBoundaryUsesInterface: /InterfaceDependencyBoundary<RouteSyncManifestFlow, RouteSyncManifestDataflowSurface>/.test(dfi),
  ecommerceFixturePresent: fixtureMissing.length === 0,
};

const result = {
  phase: 1121,
  direction: 'upstream => wiring => interface => downstream',
  relationFamilies: relationKinds,
  checks,
  counts: {
    compilerStructuralDefinitions: compilerStructuralDefinitions.length,
    upstreamCompilerImports: upstreamCompilerImports.length,
    domainCompilerImports: domainCompilerImports.length,
    semanticCompilerImports: semanticCompilerImports.length,
    legacyRefs: legacyRefs.length,
    cliCoreSourceImports: cliCoreSourceImports.length,
  },
  missingFixture: fixtureMissing,
  violations: Object.entries(checks).filter(([, value]) => !value).map(([key]) => key),
};
result.passed = result.violations.length === 0;
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
