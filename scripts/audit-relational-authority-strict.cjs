const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const roots = [
  'packages/core/src/compiler/scanner/lexer',
  'packages/core/src/compiler/scanner/subscanners',
  'packages/core/src/compiler/constraints',
  'packages/core/src/compiler/passes/adapter',
  'packages/core/src/semantic/kernel',
  'packages/core/src/semantic/plugins',
  'packages/core/src/ir',
  'packages/core/src/routing',
];
const excluded = new Set(['__tests__', '__archive__']);
const files = [];
const collect = target => {
  const stat = fs.statSync(target);
  if (stat.isFile()) return /\.tsx?$/.test(target) && files.push(target);
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory() && excluded.has(entry.name)) continue;
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) collect(child);
    else if (/\.tsx?$/.test(entry.name)) files.push(child);
  }
};
roots.forEach(root => collect(root));

const emptyCounts = () => ({
  if: 0, for: 0, while: 0, switch: 0,
  map: 0, filter: 0, reduce: 0, flatMap: 0,
  nullish: 0, undefined: 0, nullLiteral: 0,
  strictEquality: 0, asAssertion: 0,
});
const results = files.map(file => {
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, /\.tsx$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const counts = emptyCounts();
  const visit = node => {
    if (ts.isIfStatement(node)) counts.if += 1;
    if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) counts.for += 1;
    if (ts.isWhileStatement(node) || ts.isDoStatement(node)) counts.while += 1;
    if (ts.isSwitchStatement(node)) counts.switch += 1;
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const name = node.expression.name.text;
      if (name === 'map') counts.map += 1;
      if (name === 'filter') counts.filter += 1;
      if (name === 'reduce') counts.reduce += 1;
      if (name === 'flatMap') counts.flatMap += 1;
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) counts.nullish += 1;
    if (ts.isBinaryExpression(node) && (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken || node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken)) counts.strictEquality += 1;
    if (node.kind === ts.SyntaxKind.NullKeyword) counts.nullLiteral += 1;
    if (ts.isIdentifier(node) && node.text === 'undefined') counts.undefined += 1;
    if (ts.isAsExpression(node)) counts.asAssertion += 1;
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { file: path.relative(process.cwd(), file), parseErrors: sf.parseDiagnostics.length, counts };
});

const total = emptyCounts();
for (const result of results) for (const [key, value] of Object.entries(result.counts)) total[key] += value;
const violations = results.filter(result => result.parseErrors || Object.values(result.counts).some(Boolean));
console.log(JSON.stringify({
  policy: 'relational-authority-strict',
  roots,
  filesScanned: files.length,
  filesWithViolations: violations.length,
  total,
  violations,
}, null, 2));
process.exitCode = violations.length ? 1 : 0;
