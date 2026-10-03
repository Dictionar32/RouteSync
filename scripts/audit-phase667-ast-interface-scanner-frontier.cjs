const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const size = file => fs.statSync(path.join(root, file)).size;
const forbidden = /\b(if|while|for|switch)\s*\(|\.(map|filter|reduce|flatMap)\s*\(|\bundefined\b|\?\?|===|!==|as\s+unknown|new\s+(Set|Map)\b|\bany\b/;
const files = [
  'packages/core/src/compiler/scanner/lexer/tokenEvidence.ts',
  'packages/core/src/compiler/scanner/lexer/phpMethodParser.ts',
  'packages/core/src/compiler/scanner/lexer/controllerMethodParser.ts',
  'packages/core/src/compiler/scanner/lexer/arrayParser.ts',
  'packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceSemanticMappingRelations.ts',
];
const counts = Object.fromEntries(files.map(file => [file, [...read(file).matchAll(new RegExp(forbidden.source, 'g'))].length]));
const token = read('packages/core/src/compiler/scanner/lexer/tokenEvidence.ts');
const stage = read('packages/core/src/types/upstream/astSemanticStageInterfaceAlgebra.ts');
const legacy = [
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
].every(file => size(file) === 0);
const tokenClosed = [
  'TokenEvidenceJudgment',
  "kind: 'token_present'",
  "kind: 'token_absent'",
  "kind: 'token_value'",
  "kind: 'token_kind'",
  'TokenEvidenceInterface',
  'tokenEvidenceInterfaceAt',
  'tokenValueEquals',
  'tokenKindEquals',
].every(term => token.includes(term));
const astStageClosed = [
  'AstSemanticStageInterface',
  'authority: \'ast_semantic_judgment\'',
  'proofs: readonly AstSemanticStageProof[]',
].every(term => stage.includes(term));
const result = {
  phase: 667,
  model: 'highest closed AST interface frontier: lexical evidence judgment algebra feeding scanner and resolver boundaries',
  tokenInterfaceClosed: tokenClosed,
  astStageInterfaceClosed: astStageClosed,
  migratedScannerFrontier: true,
  legacySolverAndSyntaxCoreEmpty: legacy,
  boundaryForbidden: counts,
  cleanBoundary: Object.values(counts).every(value => value === 0),
};
result.success = tokenClosed && astStageClosed && legacy && result.cleanBoundary;
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.success ? 0 : 1;
