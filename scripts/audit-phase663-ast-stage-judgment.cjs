const fs = require('fs');
const path = require('path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const size = file => fs.statSync(path.join(root, file)).size;
const forbidden = /\b(if|while|for|switch)\s*\(|\.(map|filter|reduce|flatMap)\s*\(|\bundefined\b|\bany\b|new\s+(Set|Map)\b|\?\?|===|!==|as\s+unknown/g;
const stage = read('packages/core/src/types/upstream/astSemanticStageInterface.ts');
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
const forbiddenCounts = Object.fromEntries(boundaryFiles.map(file => [file, [...read(file).matchAll(forbidden)].length]));
const required = [
  'AstSemanticStageJudgment',
  'judgment:',
  'derivations:',
  'preservation:',
  'reasoning:',
  'closed: true',
  'stageDerivations',
  'stageRule',
  'stageWitness',
];
const portsNoRawFacts = !/kind: 'scanner_evidence_port'[^\n]*facts:/.test(stage) && !/kind: 'target_projection_port'[^\n]*facts:/.test(stage);
const allStages = ['scanner_evidence','upstream_mapping','resolver_graph','analysis','semantic_type_lowering','target_projection'].every(s => stage.includes(`stage: '${s}'`));
const result = {
  phase: 663,
  model: 'closed AST stage judgment ports with derivation witnesses and preservation contracts',
  stageJudgmentVocabulary: required.every(name => stage.includes(name)),
  allStages,
  portsCarryJudgment: stage.includes("judgment: AstSemanticStageJudgment"),
  portsNoRawFacts,
  derivationWitnesses: stage.includes('stageDerivations(stageFactsForJudgment(stage, facts))') && stage.includes("kind: 'ast_semantic_derivation'"),
  preservationAttached: stage.includes('preservation: contract.preservation'),
  declarativeReasoning: stage.includes('declarative_relation_rewrite_fixed_point') && preservation.includes('declarative_relation_rewrite_fixed_point'),
  legacySolverEmpty: size('packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts') === 0,
  syntaxCoreEmpty: size('packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts') === 0,
  canonicalForbidden: forbiddenCounts,
};
result.cleanBoundary = Object.values(forbiddenCounts).every(count => count === 0);
result.success = result.stageJudgmentVocabulary && result.allStages && result.portsCarryJudgment && result.portsNoRawFacts && result.derivationWitnesses && result.preservationAttached && result.declarativeReasoning && result.legacySolverEmpty && result.syntaxCoreEmpty && result.cleanBoundary;
console.log(JSON.stringify(result, null, 2));
process.exit(result.success ? 0 : 1);
