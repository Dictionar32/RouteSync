const fs = require('fs');
const path = require('path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const size = file => fs.statSync(path.join(root, file)).size;
const forbidden = /\b(if|while|for|switch)\s*\(|\.(map|filter|reduce|flatMap)\s*\(|\bundefined\b|\bany\b|new\s+(Set|Map)\b|\?\?|===|!==|as\s+unknown/g;
const contract = read('packages/core/src/types/upstream/astSemanticStageInterface.ts');
const preservation = read('packages/core/src/types/upstream/astSemanticStagePreservation.ts');
const boundaryFiles = [
  'packages/core/src/types/upstream/astSemanticStageInterface.ts',
  'packages/core/src/types/upstream/astSemanticStageContract.ts',
  'packages/core/src/types/upstream/astSemanticStagePreservation.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteEngine.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxJudgmentRewriteEngine.ts',
  'packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptLoweringSemanticRelations.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptTargetSurfaceRelations.ts',
];
const canonicalForbidden = Object.fromEntries(boundaryFiles.map(file => [file, [...read(file).matchAll(forbidden)].length]));
const requiredPreservation = ['AstSemanticPreservationRelation', 'AstSemanticPreservationFact', 'stagePreservationFacts', 'preservationContract'];
const result = {
  phase: 662,
  model: 'closed AST stage contracts with typed semantic preservation relations',
  preservationVocabulary: requiredPreservation.every(name => preservation.includes(name)),
  sixStagePreservation: ['scanner_preservation','mapping_preservation','resolver_preservation','analysis_preservation','lowering_preservation','target_preservation'].every(name => preservation.includes(name)),
  declarativeReasoning: contract.includes('declarative_relation_rewrite_fixed_point') && preservation.includes('declarative_relation_rewrite_fixed_point'),
  export: read('packages/core/src/types/upstream/index.ts').includes("./astSemanticStagePreservation"),
  legacySolverEmpty: size('packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts') === 0,
  syntaxCoreEmpty: size('packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts') === 0,
  canonicalForbidden,
};
result.cleanBoundary = Object.values(canonicalForbidden).every(count => count === 0);
result.success = result.preservationVocabulary && result.sixStagePreservation && result.declarativeReasoning && result.export && result.legacySolverEmpty && result.syntaxCoreEmpty && result.cleanBoundary;
console.log(JSON.stringify(result, null, 2));
process.exit(result.success ? 0 : 1);
