const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const roots = [
  'packages/core/src/semantic/kernel',
  'packages/core/src/semantic/plugins',
  'packages/core/src/compiler/constraints',
  'packages/core/src/compiler/scanner/semantic',
  'packages/core/src/compiler/scanner/lexer/routeAst',
];

const forbidden = {
  if: ts.SyntaxKind.IfStatement,
  for: [ts.SyntaxKind.ForStatement, ts.SyntaxKind.ForOfStatement, ts.SyntaxKind.ForInStatement],
  while: [ts.SyntaxKind.WhileStatement, ts.SyntaxKind.DoStatement],
  switch: ts.SyntaxKind.SwitchStatement,
  as: ts.SyntaxKind.AsExpression,
  null: ts.SyntaxKind.NullKeyword,
  undefined: null,
  nullish: ts.SyntaxKind.QuestionQuestionToken,
  strictEquality: [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken],
};

const files = [];
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
  const full = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(full) : /\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name) ? files.push(full) : undefined;
});
roots.forEach(root => walk(root));

const countFile = file => {
  const source = fs.readFileSync(file, 'utf8');
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const count = { if: 0, for: 0, while: 0, switch: 0, map: 0, filter: 0, reduce: 0, flatMap: 0, undefined: 0, nullish: 0, null: 0, strictEquality: 0, as: 0, unknown: 0 };
  const visit = node => {
    const hit = key => count[key] += 1;
    const kind = node.kind;
    if (kind === forbidden.if) hit('if');
    if (forbidden.for.includes?.(kind) || kind === ts.SyntaxKind.ForStatement || kind === ts.SyntaxKind.ForOfStatement || kind === ts.SyntaxKind.ForInStatement) hit('for');
    if (forbidden.while.includes?.(kind) || kind === ts.SyntaxKind.WhileStatement || kind === ts.SyntaxKind.DoStatement) hit('while');
    if (kind === forbidden.switch) hit('switch');
    if (kind === forbidden.as) hit('as');
    if (kind === forbidden.null) hit('null');
    if (kind === forbidden.nullish) hit('nullish');
    if (kind === ts.SyntaxKind.UnknownKeyword) hit('unknown');
    if (kind === ts.SyntaxKind.BinaryExpression && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(node.operatorToken.kind)) hit('strictEquality');
    if (kind === ts.SyntaxKind.CallExpression && node.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
      const name = node.expression.name.text;
      return ['map', 'filter', 'reduce', 'flatMap'].includes(name) ? hit(name) : ts.forEachChild(node, visit);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return count;
};

const report = files.map(file => ({ file: path.relative(process.cwd(), file), counts: countFile(file) }));
const totals = report.reduce((acc, entry) => Object.keys(acc).reduce((next, key) => Object.assign(next, { [key]: next[key] + entry.counts[key] }), acc), { if: 0, for: 0, while: 0, switch: 0, map: 0, filter: 0, reduce: 0, flatMap: 0, undefined: 0, nullish: 0, null: 0, strictEquality: 0, as: 0, unknown: 0 });
console.log(JSON.stringify({ phase: 384, filesScanned: files.length, totals, zeroViolationFiles: report.filter(entry => Object.values(entry.counts).every(value => value === 0)).length, violations: report.filter(entry => Object.values(entry.counts).some(value => value > 0)) }, null, 2));
