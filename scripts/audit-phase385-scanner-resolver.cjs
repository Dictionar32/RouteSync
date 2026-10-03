const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const roots = [
  'packages/core/src/compiler/scanner/lexer',
  'packages/core/src/compiler/scanner/semantic',
  'packages/core/src/semantic/plugins',
  'packages/cli/src/resolvers',
  'packages/cli/src/generators/semantic',
];
const files = [];
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
  const full = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(full) : /\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name) ? files.push(full) : undefined;
});
roots.forEach(root => fs.existsSync(root) && walk(root));
const countsOf = file => {
  const source = fs.readFileSync(file, 'utf8');
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const count = { if: 0, for: 0, while: 0, switch: 0, map: 0, filter: 0, reduce: 0, flatMap: 0, undefined: 0, nullish: 0, null: 0, strictEquality: 0, as: 0, unknown: 0 };
  const visit = node => {
    const hit = key => { count[key] += 1; };
    const k = node.kind;
    if (k === ts.SyntaxKind.IfStatement) hit('if');
    if ([ts.SyntaxKind.ForStatement, ts.SyntaxKind.ForOfStatement, ts.SyntaxKind.ForInStatement].includes(k)) hit('for');
    if ([ts.SyntaxKind.WhileStatement, ts.SyntaxKind.DoStatement].includes(k)) hit('while');
    if (k === ts.SyntaxKind.SwitchStatement) hit('switch');
    if (k === ts.SyntaxKind.AsExpression) hit('as');
    if (k === ts.SyntaxKind.NullKeyword) hit('null');
    if (k === ts.SyntaxKind.QuestionQuestionToken) hit('nullish');
    if (k === ts.SyntaxKind.UnknownKeyword) hit('unknown');
    if (k === ts.SyntaxKind.BinaryExpression && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(node.operatorToken.kind)) hit('strictEquality');
    if (k === ts.SyntaxKind.CallExpression && node.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
      const name = node.expression.name.text;
      const key = ['map', 'filter', 'reduce', 'flatMap'].find(candidate => candidate === name);
      if (key) hit(key);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return count;
};
const report = files.map(file => ({ file: path.relative(process.cwd(), file), counts: countsOf(file) }));
const totals = Object.keys(report[0]?.counts || {}).reduce((acc, key) => Object.assign(acc, { [key]: report.reduce((sum, entry) => sum + entry.counts[key], 0) }), {});
console.log(JSON.stringify({ phase: 385, roots, filesScanned: files.length, totals, zeroViolationFiles: report.filter(entry => Object.values(entry.counts).every(value => value === 0)).length, violations: report.filter(entry => Object.values(entry.counts).some(value => value > 0)) }, null, 2));
