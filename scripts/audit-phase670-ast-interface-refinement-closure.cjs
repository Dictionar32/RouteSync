const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/semantic/kernel/relationalSequence.ts',
  'packages/core/src/compiler/scanner/descriptors/request/controllerExpressionAlgebra.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticStateDataFlow.ts',
  'packages/core/src/compiler/scanner/semantic/route/routeMiddlewareKnowledgeCatalog.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxRelationProgram.ts',
];
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const forbidden = /\bas unknown\b|\bundefined\b|\bnew Set\b|\bnew Map\b|\.map\s*\(|\.filter\s*\(|\.reduce\s*\(|\.flatMap\s*\(|\bif\s*\(|\bwhile\s*\(|\bfor\s*\(|\bswitch\s*\(|\?\?|===/g;
const extract = /\bas\s+Extract\s*</g;
const boundary = Object.fromEntries(files.map(f => [f, {
  forbidden: (read(f).match(forbidden) || []).length,
  extractCasts: (read(f).match(extract) || []).length,
}]));
const relationSource = read('packages/core/src/semantic/kernel/relationalSequence.ts');
const solver = read('packages/core/src/semantic/kernel/semanticDecisionRewriteEngine.ts');
const legacySolver = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts');
const syntaxCore = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts');
const success =
  relationSource.includes('export const relationVariantFold') &&
  solver.includes('SemanticVariantRewriteCandidate') &&
  Object.values(boundary).every(v => v.forbidden === 0 && v.extractCasts === 0) &&
  fs.statSync(legacySolver).size === 0 &&
  fs.statSync(syntaxCore).size === 0;
console.log(JSON.stringify({ phase: 670, model: 'highest AST interface refinement closure: typed relation-variant folds across ternary scanner, semantic data-flow analysis and resolver knowledge boundaries', relationVariantFold: relationSource.includes('export const relationVariantFold'), proofCarryingRewrite: solver.includes('SemanticVariantRewriteCandidate'), legacySolverEmpty: fs.statSync(legacySolver).size === 0, syntaxCoreEmpty: fs.statSync(syntaxCore).size === 0, boundary, success }, null, 2));
process.exit(success ? 0 : 1);
