const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const sdk = path.join(root, 'packages/sdk');
const read = p => fs.readFileSync(p, 'utf8');
const exists = p => fs.existsSync(p);
const walk = dir => {
  const out = [];
  if (!exists(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && p.endsWith('.ts')) out.push(p);
  }
  return out;
};
const rel = p => path.relative(root, p);
const upstream = walk(path.join(core, 'types/upstream'));
const scanner = walk(path.join(core, 'compiler/scanner'));
const productionUpstream = upstream.filter(p => !/[\\/]__tests__[\\/]/.test(p));
const scannerText = scanner.map(p => ({ p, text: read(p) }));
const genericKernelNames = ['relationalSequence','semanticRelations','relationMembership'];
const scannerGenericKernelImports = scannerText
  .filter(({text}) => genericKernelNames.some(n => text.includes(`semantic/kernel/${n}`)))
  .map(({p}) => rel(p));
const reverseUpstreamImports = productionUpstream
  .filter(p => /semantic[\\/]kernel|compiler[\\/]scanner|compiler[\\/]domain|compiler[\\/]passes|compiler[\\/]ir/.test(read(p)))
  .map(rel);
const foundation = path.join(core, 'semantic/foundation');
const fixture = path.join(sdk, 'tests/fixtures/ecommerce-shop-source');
const fixtureFiles = exists(fixture) ? fs.readdirSync(fixture, { recursive: true }).filter(x => /\.php$/.test(x)) : [];
const oldExamplesAbsent = !exists(path.join(root,'examples/ecomerce-shop-source')) && !exists(path.join(root,'examples/ecommerce-shop-source'));
const semanticDataflow = read(path.join(core, 'compiler/analysis/astDataflowAuthority.ts'));
const dataflowInterface = read(path.join(core, 'types/upstream/semanticDataflowInterface.ts'));
const astAnalysis = read(path.join(core, 'compiler/analysis/astAnalysisInterface.ts'));
const graph = read(path.join(core, 'graph/service/manifestGraphCompiler.ts'));
const policyRelation = read(path.join(core, 'types/upstream/controllerActionPolicyRelations.ts'));
const routePolicyRelation = read(path.join(core, 'types/upstream/routeActionPolicyRelations.ts'));
const checks = {
  foundationOwnsGenericRelations: genericKernelNames.every(n => exists(path.join(foundation, `${n}.ts`))),
  scannerHasNoGenericKernelImports: scannerGenericKernelImports.length === 0,
  upstreamHasNoProductionReverseImports: reverseUpstreamImports.length === 0,
  dataflowAuthorityProducesJudgment: /SemanticDataflowJudgment|semantic_dataflow_judgment/.test(semanticDataflow),
  dataflowInterfaceConsumesJudgment: /semanticDataflowInterfaceFromJudgment/.test(dataflowInterface),
  astAnalysisConsumesCanonicalDataflow: /semanticDataflowInterfaceFromJudgment/.test(astAnalysis),
  graphConsumesStructuralProjection: /isStructuralSemanticRelation|projectStructuralSemanticRelationToGraphEdge/.test(graph),
  policyRelationsAreCanonical: /ControllerActionPolicyRelation/.test(policyRelation) && /RouteActionPolicyRelation/.test(routePolicyRelation),
  fixtureExists: exists(fixture) && fixtureFiles.length > 0,
  fixtureHasSdkConsumers: exists(path.join(sdk,'tests/middlewareProducer.spec.ts')) && exists(path.join(sdk,'tests/dtoAstProducer.spec.ts')) && exists(path.join(sdk,'tests/attributeProducer.spec.ts')),
  historicalExampleTreesAbsent: oldExamplesAbsent
};
const result = {
  phase: 953,
  ownership: {
    scannerGenericKernelImports,
    reverseUpstreamImports,
    foundation: rel(foundation),
  },
  fixture: { path: rel(fixture), phpFiles: fixtureFiles },
  endToEnd: {
    source: 'scanner semantic evidence',
    authority: 'astDataflowAuthority -> SemanticDataflowJudgment',
    interface: 'semanticDataflowInterfaceFromJudgment -> AstAnalysisInterface',
    graph: 'CompleteLaravelSourceModel -> structural relation projection -> GraphEdgeRelation',
    fixtureProvenance: 'SDK fixture is consumed by producer tests; core highest-dataflow regression remains inline source and is not falsely labeled as fixture execution'
  },
  checks,
  clean: Object.values(checks).every(Boolean)
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.clean ? 0 : 1);
