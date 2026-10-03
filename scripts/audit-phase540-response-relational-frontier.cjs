const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const targets = ['packages/core/src/compiler/scanner/subscanners/responseProducer.ts'];
function audit(source, file) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const counts = { if:0, for:0, while:0, switch:0, map:0, filter:0, reduce:0, flatMap:0, undefined:0, null:0, strictEquality:0, asUnknown:0, or:0, and:0, trim:0, slice:0, never:0, indexPlus123:0, ternary:0 };
  function visit(node) {
    if (node.kind === ts.SyntaxKind.IfStatement) counts.if++;
    if ([ts.SyntaxKind.ForStatement, ts.SyntaxKind.ForInStatement, ts.SyntaxKind.ForOfStatement].includes(node.kind)) counts.for++;
    if ([ts.SyntaxKind.WhileStatement, ts.SyntaxKind.DoStatement].includes(node.kind)) counts.while++;
    if (node.kind === ts.SyntaxKind.SwitchStatement) counts.switch++;
    if (node.kind === ts.SyntaxKind.ConditionalExpression) counts.ternary++;
    if (node.kind === ts.SyntaxKind.NullKeyword) counts.null++;
    if (node.kind === ts.SyntaxKind.UndefinedKeyword) counts.undefined++;
    if (node.kind === ts.SyntaxKind.BinaryExpression) {
      const op = node.operatorToken.kind;
      if (op === ts.SyntaxKind.EqualsEqualsEqualsToken) counts.strictEquality++;
      if (op === ts.SyntaxKind.BarBarToken) counts.or++;
      if (op === ts.SyntaxKind.AmpersandAmpersandToken) counts.and++;
      if (op === ts.SyntaxKind.PlusToken && node.right.kind === ts.SyntaxKind.NumericLiteral && node.right.text === '123' && node.left.kind === ts.SyntaxKind.Identifier && node.left.text === 'index') counts.indexPlus123++;
    }
    if (node.kind === ts.SyntaxKind.AsExpression && node.type.kind === ts.SyntaxKind.UnknownKeyword) counts.asUnknown++;
    if (node.kind === ts.SyntaxKind.CallExpression && ts.isPropertyAccessExpression(node.expression)) {
      const n = node.expression.name.text;
      if (n === 'map') counts.map++;
      if (n === 'filter') counts.filter++;
      if (n === 'reduce' || n === 'reduceRight') counts.reduce++;
      if (n === 'flatMap') counts.flatMap++;
      if (n === 'trim') counts.trim++;
      if (n === 'slice') counts.slice++;
    }
    if (node.kind === ts.SyntaxKind.NeverKeyword) counts.never++;
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return counts;
}
const result = Object.fromEntries(targets.map(rel => {
  const file = path.resolve(rel);
  const source = fs.readFileSync(file, 'utf8');
  const transpiled = ts.transpileModule(source, { compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}, reportDiagnostics:true, fileName:file });
  return [rel, {...audit(source,file), transpileDiagnostics:(transpiled.diagnostics||[]).map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))}];
}));
const clean = Object.values(result).every(x => Object.entries(x).every(([k,v]) => k === 'transpileDiagnostics' ? v.length === 0 : v === 0));
console.log(JSON.stringify({phase:540,targets:result,closedSurfaceClean:clean,transpileDiagnosticsClean:clean,ok:clean},null,2));
if (!clean) process.exit(1);
