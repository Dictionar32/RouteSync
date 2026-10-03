const fs = require('fs');
const path = require('path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const size = file => fs.statSync(path.join(root, file)).size;
const forbidden = /\b(if|while|for|switch)\s*\(|\.(map|filter|reduce|flatMap)\s*\(|\bundefined\b|\bany\b|new\s+(Set|Map)\b|\?\?|\b(?:value|result|output|state)\s*:\s*null\b|\b(?:return|throw)\s+null\b|===|!==|as\s+unknown/g;
const boundaryFiles = [
  'packages/core/src/types/upstream/astSemanticStageInterface.ts',
  'packages/core/src/types/upstream/astSemanticStageContract.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteEngine.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxJudgmentRewriteEngine.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptLoweringSemanticRelations.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptTargetSurfaceRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts',
  'packages/core/src/compiler/scanner/upstream/route/routeGroupSemanticResolver.ts',
  'packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceSemanticMappingRelations.ts',
];
const stageContract = read('packages/core/src/types/upstream/astSemanticStageInterface.ts');
const graph = read('packages/core/src/types/upstream/astSemanticStageContract.ts');
const requiredContracts = [
  'SCANNER_EVIDENCE_CONTRACT', 'UPSTREAM_MAPPING_CONTRACT', 'RESOLVER_GRAPH_CONTRACT',
  'ANALYSIS_CONTRACT', 'SEMANTIC_TYPE_LOWERING_CONTRACT', 'TARGET_PROJECTION_CONTRACT',
];
const requiredFactories = [
  'createScannerEvidencePort', 'createUpstreamMappingPort', 'createResolverGraphPort',
  'createAnalysisPort', 'createSemanticTypeLoweringPort', 'createTargetProjectionPort',
];
const requiredEdges = [
  'source_syntax', 'scanner_evidence', 'upstream_mapping', 'resolver_graph',
  'analysis', 'semantic_type_lowering', 'target_projection',
];
const canonicalForbidden = Object.fromEntries(boundaryFiles.map(file => [file, [...read(file).matchAll(forbidden)].length]));
const result = {
  phase: 661,
  model: 'closed AST stage contracts with typed semantic edges and rewrite authority',
  contracts: requiredContracts.every(name => stageContract.includes(name)),
  factories: requiredFactories.every(name => stageContract.includes(name)),
  graph: requiredEdges.every(name => graph.includes(name)),
  graphContractExported: read('packages/core/src/types/upstream/index.ts').includes("./astSemanticStageContract"),
  legacySolverEmpty: size('packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts') === 0,
  syntaxCoreEmpty: size('packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts') === 0,
  canonicalForbidden,
};
result.cleanBoundary = Object.values(canonicalForbidden).every(count => count === 0);
result.success = result.contracts && result.factories && result.graph && result.graphContractExported && result.legacySolverEmpty && result.syntaxCoreEmpty && result.cleanBoundary;
console.log(JSON.stringify(result, null, 2));
process.exit(result.success ? 0 : 1);
