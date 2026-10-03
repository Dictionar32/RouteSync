const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const roots = [
  'packages/core/src/compiler/scanner/lexer',
  'packages/core/src/compiler/scanner/resolvers',
];
const files = [];
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
  const file = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(file);
  if (entry.isFile() && file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts')) files.push(file);
});
roots.forEach(rootDir => walk(path.join(root, rootDir)));
const scan = file => {
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const counts = { if: 0, for: 0, while: 0, switch: 0, ternary: 0, map: 0, filter: 0, reduce: 0, flatMap: 0, trim: 0, slice: 0, strictEqual: 0, logicalOr: 0, logicalAnd: 0, undefinedIdentifier: 0 };
  const visit = node => {
    if (ts.isIfStatement(node)) counts.if++;
    if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node)) counts.for++;
    if (ts.isWhileStatement(node) || ts.isDoStatement(node)) counts.while++;
    if (ts.isSwitchStatement(node)) counts.switch++;
    if (ts.isConditionalExpression(node)) counts.ternary++;
    if (ts.isIdentifier(node) && node.text === 'undefined') counts.undefinedIdentifier++;
    if (ts.isBinaryExpression(node)) {
      const kind = node.operatorToken.kind;
      if (kind === ts.SyntaxKind.EqualsEqualsEqualsToken || kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) counts.strictEqual++;
      if (kind === ts.SyntaxKind.BarBarToken) counts.logicalOr++;
      if (kind === ts.SyntaxKind.AmpersandAmpersandToken) counts.logicalAnd++;
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const name = node.expression.name.text;
      if (name in counts) counts[name]++;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { file: path.relative(root, file), counts };
};
const results = files.sort().map(scan);
const executableLeaks = results.filter(result => Object.entries(result.counts).some(([key, value]) => value && !['undefinedIdentifier'].includes(key)));
const undefinedLeaks = results.filter(result => result.counts.undefinedIdentifier > 0);
const output = {
  phase: 548,
  scope: 'production scanner/lexer + resolver executable semantics',
  files: results,
  executableSurfaceClean: executableLeaks.length === 0,
  undefinedIdentifierLeaks: undefinedLeaks.map(result => ({ file: result.file, count: result.counts.undefinedIdentifier })),
  note: 'Language/operator strings and AST data literals are evidence vocabulary; executable host control/operators are audited structurally.',
  ok: executableLeaks.length === 0,
};
console.log(JSON.stringify(output, null, 2));
process.exitCode = output.ok ? 0 : 1;
