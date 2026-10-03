const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const root = process.cwd();
const targets = [
  'packages/core/src/compiler/scanner/LaravelSourceLexer.ts',
  'packages/core/src/compiler/scanner/lexer/tokenizer.ts',
  'packages/core/src/compiler/scanner/lexer/SourceStream.ts',
  'packages/core/src/compiler/scanner/lexer/tokenize/compoundScanners.ts',
  'packages/core/src/compiler/scanner/resolvers/RouteDomainResolver.ts',
  'packages/core/src/compiler/scanner/resolvers/RouteSecurityResolver.ts',
  'packages/core/src/compiler/scanner/resolvers/RouteCrudClassifier.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteEngine.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticKnowledgeDataFlowRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlowRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticEvidenceRelationCompiler.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRouteSyntaxRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticObjectIdentityRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticConstraintCalculus.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticConstraintHandlingRules.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticDataFlowAnalyzer.ts',
];
const patterns = {
  if: /\bif\s*\(/g,
  for: /\bfor\s*\(/g,
  while: /\bwhile\s*\(/g,
  switch: /\bswitch\s*\(/g,
  map: /\.(map|filter|reduce|flatMap)\s*\(/g,
  undefined: /\bundefined\b/g,
  null: /\bnull\b/g,
  strictEqual: /===/g,
  logicalOr: /\|\|/g,
  logicalAnd: /&&/g,
  asUnknown: /\bas\s+unknown\b/g,
  trim: /\.trim\s*\(/g,
  slice: /\.slice\s*\(/g,
  index123: /index\s*\+\s*123/g,
  ternary: /\?[^?\n:]+:/g,
};
const diagnostics = file => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  return (ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true, fileName: file }).diagnostics || []).map(d => ts.flattenDiagnosticMessageText(d.messageText, ' '));
};
const results = targets.map(file => {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const counts = Object.fromEntries(Object.entries(patterns).map(([key, pattern]) => [key, [...source.matchAll(pattern)].length]));
  return { file, counts, transpileDiagnostics: diagnostics(file) };
});
const executableClean = results.every(r => Object.entries(r.counts).every(([k,v]) => !['undefined','null','logicalOr','logicalAnd','ternary'].includes(k) ? v === 0 : true));
const transpileClean = results.every(r => r.transpileDiagnostics.length === 0);
console.log(JSON.stringify({ phase: 547, results, executableSurfaceClean: executableClean, transpileDiagnosticsClean: transpileClean, ok: executableClean && transpileClean }, null, 2));
process.exitCode = executableClean && transpileClean ? 0 : 1;
