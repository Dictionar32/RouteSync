const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const src = path.join(root, 'src');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.ts') ? [path.join(dir, e.name)] : []
);
const productionFiles = dir => walk(dir).filter(f => !f.includes('/__tests__/') && !f.endsWith('.test.ts'));
const has = (files, re) => files.filter(f => re.test(read(f)));
const allText = files => files.map(read).join('\n');

const upstream = productionFiles('src/types/upstream');
const domain = productionFiles('src/types/domain');
const semantic = productionFiles('src/semantic');
const graph = productionFiles('src/graph');
const ir = productionFiles('src/compiler/ir');
const dataflow = productionFiles('src/compiler/analysis');
const cli = walk('../cli/src/commands');

const concreteManifestForbidden = [...graph, ...ir, ...dataflow].filter(f => {
  const t = read(f);
  return /\bRouteSyncManifest\b/.test(t) && !/\bRouteSyncManifestFlow\b/.test(t);
});
const compilerStructuralAuthority = has(
  productionFiles('src/compiler'),
  /export\s+(?:type|interface)\s+StructuralSemanticRelation|export\s+(?:type|interface)\s+SemanticRelationGraph/
);
const domainCompiler = has(domain, /from ['"][^'\"]*compiler\//);
const upstreamCompiler = has(upstream, /from ['"][^'\"]*compiler\//);
const semanticCompiler = has(semantic, /from ['"][^'\"]*compiler\/(?:types|domain|scanner)/);
const irCompilerSemantic = has(ir, /from ['"][^'\"]*compiler\/types\/SemanticType/);
const legacy = has([...walk('src'), ...walk('../cli/src')].filter(f => !f.includes('/node_modules/')), /StaticLaravelScanner|class\s+LaravelScanner/);
const cliDirect = has(cli, /from ['"][^'\"]*(?:\.\.\/){1,}.*(?:packages\/core\/src|core\/src)\//);

const requiredUpstream = {
  route: 'src/types/upstream/route.ts',
  controller: 'src/types/upstream/controller.ts',
  modelRelation: 'src/types/upstream/modelRelation.ts',
  resource: 'src/types/upstream/resource.ts',
  schema: 'src/types/upstream/schema.ts',
  manifest: 'src/types/upstream/manifest.ts',
  semanticReferences: 'src/types/upstream/semanticReferences.ts',
};
const missingUpstream = Object.entries(requiredUpstream).filter(([, p]) => !fs.existsSync(path.join(root, p))).map(([k]) => k);

const ecommerce = path.resolve(root, '../../examples/ecommerce-shop-source');
const ecommerceFiles = fs.existsSync(ecommerce) ? fs.readdirSync(ecommerce, { recursive: true }) : [];
const ecommerceRequired = [
  'routes/api.php', 'routes/web.php', 'app/Http/Controllers', 'app/Models',
  'app/Http/Resources', 'database/migrations', 'frontend/src/api/schemas'
];
const missingEcommerce = ecommerceRequired.filter(p => !fs.existsSync(path.join(ecommerce, p)));

const result = {
  phase: 1119,
  direction: 'upstream => wiring => interface => downstream',
  checks: {
    canonicalUpstreamRouteControllerModelRelationResourceSchema: missingUpstream.length === 0,
    upstreamNoCompilerImports: upstreamCompiler.length === 0,
    domainNoCompilerImports: domainCompiler.length === 0,
    semanticNoCompilerImplementationImports: semanticCompiler.length === 0,
    graphIrDataflowConsumeFlowNotConstructionManifest: concreteManifestForbidden.length === 0,
    compilerDoesNotRedefineCanonicalStructuralRelations: compilerStructuralAuthority.length === 0,
    dataFlowInterfaceGeneric: !/Laravel|Route|Controller|Resource|Model|Schema/.test(read('src/types/dataflow/dataFlowInterface.ts')),
    dependencyBoundaryGeneric: !/Laravel|Route|Controller|Resource|Model|Schema/.test(read('src/types/interfaces/interfaceDependencyBoundary.ts')),
    cliPackageSurfaceOnly: cliDirect.length === 0,
    legacyProductionEmpty: legacy.length === 0,
    ecommerceFixturePresent: missingEcommerce.length === 0,
  },
  violations: {
    missingUpstream,
    upstreamCompiler: upstreamCompiler.map(f => path.relative(root, f)),
    domainCompiler: domainCompiler.map(f => path.relative(root, f)),
    semanticCompiler: semanticCompiler.map(f => path.relative(root, f)),
    graphIrDataflowConcreteManifest: concreteManifestForbidden.map(f => path.relative(root, f)),
    compilerStructuralRelationRedefinitions: compilerStructuralAuthority.map(f => path.relative(root, f)),
    cliDirectSourceImports: cliDirect.map(f => path.relative(root, f)),
    legacy: legacy.map(f => path.relative(root, f)),
    missingEcommerce,
  },
};
result.passed = Object.values(result.checks).every(Boolean);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.passed ? 0 : 1;
