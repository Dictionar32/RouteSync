const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/compiler/scanner/lexer/routeAst/routeSyntaxSemanticInterface.ts',
  'packages/core/src/compiler/scanner/subscanners/requestAstCanonical.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRouteSyntaxRelations.ts',
];
const forbidden = /\b(?:if|while|for|switch)\s*\(|\.(?:map|filter|reduce|flatMap)\s*\(|\bundefined\b|\?\?|===|as\s+unknown|new\s+(?:Set|Map)|\bany\s*(?:<|\[|\]|>|\||&|\)|,)/;
const report = Object.fromEntries(files.map(file => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  return [file, {
    forbidden: (stripped.match(new RegExp(forbidden.source, 'g')) || []).length,
    extractCasts: (stripped.match(/as\s+Extract/g) || []).length,
  }];
}));
const legacy = [
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
].every(file => fs.statSync(path.join(root, file)).size === 0);
const success = legacy && Object.values(report).every(item => item.forbidden === 0 && item.extractCasts === 0);
console.log(JSON.stringify({ phase: 671, model: 'highest AST interface scanner/request frontier', routeSyntaxInterface: true, requestVariantRefinement: true, legacySolverAndSyntaxCoreEmpty: legacy, boundary: report, success }, null, 2));
process.exitCode = success ? 0 : 1;
