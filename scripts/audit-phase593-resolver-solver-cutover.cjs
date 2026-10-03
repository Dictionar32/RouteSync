const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/compiler/constraints/UnionFind.ts',
  'packages/core/src/compiler/constraints/TypeEnvironment.ts',
  'packages/core/src/compiler/constraints/solver/constraintStep.ts',
  'packages/core/src/compiler/constraints/ConstraintSolver.ts',
  'packages/core/src/compiler/constraints/solver/variableResolver.ts',
  'packages/core/src/compiler/scanner/resolvers/RouteDomainResolver.ts',
];

const empty = () => ({
  if: 0, for: 0, while: 0, switch: 0, ternary: 0,
  map: 0, filter: 0, reduce: 0, flatMap: 0,
  undefined: 0, null: 0, nullish: 0, strictEqual: 0, strictNotEqual: 0,
  asUnknown: 0, Set: 0, Map: 0, any: 0, new: 0,
});

const audit = (source) => {
  const result = empty();
  const sf = ts.createSourceFile('audit.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const visit = node => {
    if (node.kind === ts.SyntaxKind.IfStatement) result.if++;
    if (node.kind === ts.SyntaxKind.ForStatement || node.kind === ts.SyntaxKind.ForInStatement || node.kind === ts.SyntaxKind.ForOfStatement) result.for++;
    if (node.kind === ts.SyntaxKind.WhileStatement || node.kind === ts.SyntaxKind.DoStatement) result.while++;
    if (node.kind === ts.SyntaxKind.SwitchStatement) result.switch++;
    if (node.kind === ts.SyntaxKind.ConditionalExpression) result.ternary++;
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const name = node.expression.name.text;
      if (name === 'map') result.map++;
      if (name === 'filter') result.filter++;
      if (name === 'reduce') result.reduce++;
      if (name === 'flatMap') result.flatMap++;
    }
    if (ts.isIdentifier(node)) {
      if (node.text === 'undefined') result.undefined++;
      if (node.text === 'null') result.null++;
      if (node.text === 'Set') result.Set++;
      if (node.text === 'Map') result.Map++;
      if (node.text === 'any') result.any++;
    }
    if (ts.isNewExpression(node)) result.new++;
    if (ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.UnknownKeyword) result.asUnknown++;
    if (ts.isBinaryExpression(node)) {
      if (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) result.nullish++;
      if (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) result.strictEqual++;
      if (node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) result.strictNotEqual++;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return result;
};

const filesOut = files.map(file => {
  const absolute = path.join(root, file);
  return { file, constructs: audit(fs.readFileSync(absolute, 'utf8')) };
});
const aggregate = filesOut.reduce((acc, item) => {
  for (const [key, value] of Object.entries(item.constructs)) acc[key] += value;
  return acc;
}, empty());
const report = {
  phase: 593,
  title: 'resolver solver relational cutover',
  files: filesOut,
  aggregate,
  changedSurfaceClosed: Object.values(aggregate).every(value => value === 0),
};
fs.writeFileSync(path.join(root, 'docs/PHASE593_RESOLVER_SOLVER_RELATIONAL_CUTOVER_AUDIT.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.changedSurfaceClosed ? 0 : 1;
