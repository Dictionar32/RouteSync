const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const walk = dir => {
  const files = [];
  const absolute = path.join(root, dir);
  if (!exists(dir)) return files;
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(relative));
    else if (/\.(ts|tsx|js|cjs|mjs)$/.test(entry.name)) files.push(relative);
  }
  return files;
};
const coreSources = walk('packages/core/src').filter(file => !file.includes('/__tests__/') && !file.includes('/__test/') && !/(?:\.test|\.spec)\.ts$/.test(file));
const coreProductionText = coreSources.map(read).join('\n');
const fixture = 'examples/ecommerce-shop-source';
const inputFactory = read('packages/core/src/types/upstream/semanticDataflowInputFactory.ts');
const dataflow = read('packages/core/src/types/upstream/semanticDataflow.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const analysis = read('packages/core/src/compiler/analysis/astAnalysisInterface.ts');
const ir = read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts');
const graph = read('packages/core/src/graph/service/structuralSemanticRelationProjection.ts');
const checks = {
  canonicalEcommerceFixtureExists: exists(`${fixture}/routes/web.php`) && exists(`${fixture}/app/Http`),
  canonicalLaravelSourceFeedsManifest: /scanSourceAsts\(sourceProject\)/.test(manifestBuilder) && /buildCompleteLaravelSourceModel/.test(manifestBuilder),
  dataflowInputIsCanonicalADT: /export type SemanticDataflowInput\s*=/.test(dataflow) && /kind: 'semantic_dataflow_input'/.test(inputFactory),
  inputFactVocabularyIsClosed: /SemanticDataflowInputFact = Exclude<SemanticDataflowFact, \{ readonly kind: 'reaches' \}>/.test(dataflow),
  authorityOwnsJudgmentAndClosure: /createSemanticDataflowJudgment/.test(authority) && /least_fixed_point/.test(authority),
  analysisConsumesCanonicalDataflowInterface: /AstDataflowInterface/.test(analysis) && /input\.dataflow\.state\.closure/.test(analysis),
  manifestBuildsJudgmentsUpstream: /semanticDataflowJudgmentsFromInputs\(dataflowInputs\)/.test(manifestBuilder),
  irConsumesClosedDataflowState: /dataflow\.state\.closure/.test(ir) && !/createSemanticDataflowJudgment/.test(ir),
  graphKeepsStructuralRelationsDistinct: /StructuralSemanticRelation/.test(graph) && /GraphEdgeRelation/.test(graph),
  noProductionFixturePathCoupling: !/examples\/(?:ecomerce-shop-source|ecommerce-shop-source)/.test(coreProductionText),
  noLegacyAnalyzerProductionAuthority: !/(?:from|export \*) ['"][^'"]*semanticDataFlowAnalyzer['"]/.test(coreProductionText),
  packageTypeScript7ContractPreserved: JSON.parse(read('package.json')).devDependencies.typescript === '7.0.2',
};
const result = {
  audit: 'phase943-laravel-upstream-dataflow-wiring',
  topology: 'Laravel source -> CompleteLaravelSourceModel -> SemanticDataflowInput ADT -> upstream judgment/closure -> AST/DataFlow interface -> manifest/IR/graph projections',
  checks,
  passed: Object.values(checks).every(Boolean),
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
