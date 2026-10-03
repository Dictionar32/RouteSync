const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const targets = [
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/compiler/passes/adapter/contractValidator.ts',
].map(file => path.join(process.cwd(), file));
const checks = {
  if: /\bif\b/g, for: /\bfor\b/g, while: /\bwhile\b/g, switch: /\bswitch\b/g,
  map: /\bmap\b/g, filter: /\bfilter\b/g, reduce: /\breduce\b/g, flatMap: /\bflatMap\b/g,
  undefined: /\bundefined\b/g, nullish: /\?\?/g, null: /\bnull\b/g, strictEquality: /===/g,
  asUnknown: /as\s+unknown/g, or: /\|\|/g, and: /&&/g, trim: /\.trim\s*\(/g,
  slice: /\.slice\s*\(/g, never: /\bnever\b/g, indexPlus123: /index\s*\+\s*123/g,
  ternary: /(?<!\?)\?(?!\.)[^\n:;{}]+:/g,
};
const forbiddenKinds = new Set([
  ts.SyntaxKind.IfStatement, ts.SyntaxKind.ForStatement, ts.SyntaxKind.ForInStatement,
  ts.SyntaxKind.ForOfStatement, ts.SyntaxKind.WhileStatement, ts.SyntaxKind.DoStatement,
  ts.SyntaxKind.SwitchStatement, ts.SyntaxKind.ConditionalExpression,
]);
const collectionCalls = new Set(['map', 'filter', 'reduce', 'flatMap', 'trim', 'slice']);
const results = targets.map(target => {
  const source = fs.readFileSync(target, 'utf8');
  const counts = Object.fromEntries(Object.entries(checks).map(([name, regex]) => [name, (source.match(regex) || []).length]));
  const sf = ts.createSourceFile(target, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const astViolations = [];
  const visit = node => {
    if (forbiddenKinds.has(node.kind)) astViolations.push(ts.SyntaxKind[node.kind]);
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && collectionCalls.has(node.expression.name.text)) astViolations.push(`call:${node.expression.name.text}`);
    ts.forEachChild(node, visit);
  };
  visit(sf);
  const diagnostics = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }, fileName: target, reportDiagnostics: true }).diagnostics || [];
  return { target: path.relative(process.cwd(), target), counts, astViolations, transpileDiagnostics: diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')), closedSurfaceClean: Object.values(counts).every(count => count === 0) && astViolations.length === 0, transpileDiagnosticsClean: diagnostics.length === 0 };
});
const ok = results.every(r => r.closedSurfaceClean && r.transpileDiagnosticsClean);
console.log(JSON.stringify({ phase: 534, results, ok, architecture: 'evidence relations -> indexed semantic relation plans -> constraint matching -> recursive fixed-point saturation -> canonical semantic facts' }, null, 2));
process.exitCode = ok ? 0 : 1;
