const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const size = file => fs.statSync(path.join(root, file)).size;
const forbidden = /\b(if|while|for|switch)\s*\(|\.(map|filter|reduce|flatMap)\s*\(|\bundefined\b|\?\?|===|!==|as\s+unknown|new\s+(Set|Map)\b|\bany\b/;
const boundaries = [
  'packages/core/src/types/upstream/astSemanticStageInterfaceAlgebra.ts',
  'packages/core/src/types/upstream/astSemanticStageInterface.ts',
  'packages/core/src/types/upstream/astSemanticStageProof.ts',
  'packages/core/src/types/upstream/astSemanticStagePreservation.ts',
  'packages/core/src/compiler/scanner/lexer/tokenEvidence.ts',
  'packages/core/src/compiler/scanner/lexer/phpAstAlgebra.ts',
  'packages/core/src/semantic/kernel/semanticDecisionRewriteEngine.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts',
  'packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptLoweringSemanticRelations.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptTargetSurfaceRelations.ts',
];
const counts = Object.fromEntries(boundaries.map(file => [file, [...read(file).matchAll(new RegExp(forbidden.source, 'g'))].length]));
const algebra = read(boundaries[0]);
const stage = read(boundaries[1]);
const legacyEmpty = [
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
].every(size === undefined ? () => false : file => size(file) === 0);
const interfaceClosed = [
  'AstSemanticStageInterface',
  'astSemanticStageInterfaceOf',
  'astSemanticStageInterfaceAt',
  'astSemanticPipelineInterfaces',
  "authority: 'ast_semantic_judgment'",
  'proofs: readonly AstSemanticStageProof[]',
].every(term => algebra.includes(term));
const stageJudgmentClosed = stage.includes('proofObligations: readonly AstSemanticStageProof[]') && stage.includes('judgment: AstSemanticStageJudgment');
const result = {
  phase: 666,
  model: 'closed AST semantic interface algebra across scanner, mapping, resolver, analysis, lowering and target stages',
  interfaceClosed,
  stageJudgmentClosed,
  legacySolverAndSyntaxCoreEmpty: legacyEmpty,
  boundaryForbidden: counts,
  cleanBoundary: Object.values(counts).every(value => value === 0),
};
result.success = interfaceClosed && stageJudgmentClosed && legacyEmpty && result.cleanBoundary;
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.success ? 0 : 1;
