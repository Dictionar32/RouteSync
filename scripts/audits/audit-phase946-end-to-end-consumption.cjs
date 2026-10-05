const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const fail = name => { throw new Error(`Phase 946 invariant failed: ${name}`); };

const policy = read('packages/core/src/types/upstream/controllerActionPolicyRelations.ts');
const semanticRefs = read('packages/core/src/types/upstream/semanticReferences.ts');
const sourceModel = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/upstream/upstreamManifestBuilder.ts');
const graph = read('packages/core/src/graph/service/manifestGraphCompiler.ts');
const dataflow = read('packages/core/src/compiler/analysis/astDataflowAuthority.ts');
const astAnalysis = read('packages/core/src/compiler/analysis/astAnalysisInterface.ts');
const ssa = read('packages/core/src/compiler/analysis/ssa/ssaSemanticInterface.ts');

const checks = {
  canonicalUpstreamExists: exists('packages/core/src/types/upstream/semanticDataflowInterface.ts'),
  literalCoreSrcUpstreamAbsent: !exists('packages/core/src/upstream'),
  policyRelationProducedByCanonicalProjection: /controllerActionPolicyRelations\s*=/.test(policy) && /RouteActionPolicyRelation/.test(sourceModel),
  policyRelationsStoredInSourceModel: /relations:\s*sourceModelReferenceIndexFromCatalog\(catalog\)\.graph/.test(sourceModel),
  sourceModelEntersManifest: /sourceModel:\s*completeLaravelSourceModelBuildResult\.value/.test(manifestBuilder),
  graphConsumesCanonicalSourceModel: /compileGraphFromSourceModel\(manifest\.sourceModel/.test(read('packages/core/src/graph/ServiceGraphBuilder.ts')),
  graphFiltersPolicyOut: /if \(!isStructuralSemanticRelation\(relation\)\) return;/.test(graph),
  graphProjectsOnlyStructural: /projectStructuralSemanticRelationToGraphEdge\(relation\)/.test(graph),
  policyNotGenericDataflow: !/import .*SemanticDataflowFact/.test(policy) && !/SemanticDataflowFact\s*[|=]/.test(policy),
  dataflowSeedsExcludeReaches: /fact\.kind !== 'reaches'/.test(dataflow),
  canonicalDataflowInterfaceConsumed: /semanticDataflowInterfaceFromJudgment\(judgment\.dataflow\)/.test(astAnalysis),
  ssaConsumesAstAnalysisInterface: /astAnalysisInterface\(analysis\)/.test(ssa),
  noDeprecatedFactoryProductionConsumer: !/createSemanticDataflowInterface\(/.test(astAnalysis + ssa),
  noReverseProductionImport: !/(?:types\/upstream)[^\n]*compiler\/scanner|compiler\/scanner[^\n]*(?:types\/upstream)/.test(read('packages/core/src/types/upstream/semanticDataflowInterface.ts')),
  ecommerceFixtureExists: exists('packages/sdk/tests/fixtures/ecommerce-shop-source'),
  oldExampleTreesAbsent: !exists('examples/ecomerce-shop-source') && !exists('examples/ecommerce-shop-source'),
};

// Stronger source-level ownership assertions.
checks.policyCommentMatchesActualBoundary = /carried by the canonical source-model[\s\S]*structural graph projection deliberately filters it out/.test(policy);
checks.semanticRelationAlgebraIncludesPolicy = /export type SemanticRelation = StructuralSemanticRelation \| ControllerActionPolicyRelation \| RouteActionPolicyRelation/.test(semanticRefs);

const result = { ...checks, clean: Object.values(checks).every(Boolean) };
console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exit(1);
