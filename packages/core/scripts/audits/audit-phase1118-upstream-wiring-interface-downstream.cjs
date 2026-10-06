const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const src = path.join(root, 'src');
const read = file => fs.readFileSync(file, 'utf8');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const p = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(p) : [p];
});
const ts = dir => walk(dir).filter(f => f.endsWith('.ts'));
const importsCompiler = f => /from\s+['"][^'"]*compiler\//.test(read(f));
const production = files => files.filter(f => !f.includes(`${path.sep}__tests__${path.sep}`));

const upstream = ts(path.join(src, 'types/upstream'));
const domain = ts(path.join(src, 'types/domain'));
const semantic = ts(path.join(src, 'types/semantic'));
const ir = ts(path.join(src, 'types/ir'));
const cli = ts(path.resolve(root, '../cli/src'));
const graph = ts(path.join(src, 'graph'));

const prodDomainCompiler = production(domain).filter(importsCompiler);
const prodUpstreamCompiler = production(upstream).filter(importsCompiler);
const prodSemanticCompiler = production(semantic).filter(f => /compiler\/(types\/SemanticType|domain\/common\/typeExpressionSemanticType)/.test(read(f)));
const prodIrFacade = production(ir).filter(f => /compiler\/types\/SemanticType/.test(read(f)));
const prodGraphCompiler = production(graph).filter(importsCompiler);
const cliDirectSourceImports = cli.filter(f => /from\s+['"][^'"]*packages\/core\/src/.test(read(f)));
const legacyFiles = [...production(ts(path.join(src, 'compiler'))), ...production(cli)].filter(f => /StaticLaravelScanner|scanner[\\/]upstream/.test(read(f)));

const readText = f => read(f);
const dataFlow = readText(path.join(src, 'types/dataflow/dataFlowInterface.ts'));
const boundary = readText(path.join(src, 'types/interfaces/interfaceDependencyBoundary.ts'));
const ecommerce = path.resolve(root, '../../examples/ecommerce-shop-source');
const ecommerceChecks = {
  route: fs.existsSync(path.join(ecommerce, 'routes')),
  controller: fs.existsSync(path.join(ecommerce, 'app/Http/Controllers')),
  model: fs.existsSync(path.join(ecommerce, 'app/Models')),
  resource: fs.existsSync(path.join(ecommerce, 'app/Http/Resources')),
  schema: fs.existsSync(path.join(ecommerce, 'database/migrations')),
};

const checks = {
  typeVocabularyCanonicalUpstream: fs.existsSync(path.join(src, 'types/upstream/typeVocabulary.ts')),
  semanticTypeCanonicalDomain: fs.existsSync(path.join(src, 'types/domain/semanticType.ts')),
  domainProductionNoCompilerImports: prodDomainCompiler.length === 0,
  upstreamProductionNoCompilerImports: prodUpstreamCompiler.length === 0,
  semanticProductionNoCompilerSemanticFacade: prodSemanticCompiler.length === 0,
  irProductionNoCompilerSemanticFacade: prodIrFacade.length === 0,
  graphProductionNoCompilerImports: prodGraphCompiler.length === 0,
  dataFlowGeneric: /export type DataFlowInterface<Input, State, Node>/.test(dataFlow) && !/Laravel|RouteManifest|Controller|Resource|Model/.test(dataFlow),
  dependencyBoundaryGeneric: /InterfaceDependencyBoundary<Upstream, Downstream>/.test(boundary) && !/Laravel|RouteManifest|Controller|Resource|Model/.test(boundary),
  cliUsesPackageSurface: cliDirectSourceImports.length === 0,
  legacyProductionEmpty: legacyFiles.length === 0,
  ecommerceRoute: ecommerceChecks.route,
  ecommerceController: ecommerceChecks.controller,
  ecommerceModelRelation: ecommerceChecks.model,
  ecommerceResource: ecommerceChecks.resource,
  ecommerceSchema: ecommerceChecks.schema,
};

const result = {
  phase: 1118,
  direction: 'upstream => wiring => interface => downstream',
  checks,
  violations: {
    domainProductionCompiler: prodDomainCompiler,
    upstreamProductionCompiler: prodUpstreamCompiler,
    semanticProductionCompilerFacade: prodSemanticCompiler,
    irProductionCompilerFacade: prodIrFacade,
    graphProductionCompiler: prodGraphCompiler,
    cliDirectSourceImports,
    legacyProduction: legacyFiles,
  },
  passed: Object.values(checks).every(Boolean),
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.passed ? 0 : 1;
