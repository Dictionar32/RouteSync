const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const roots = [
  'packages/core/src/compiler/scanner/binders/resource',
  'packages/core/src/compiler/scanner/descriptors/validation/validationRuleEntry.ts',
  'packages/core/src/compiler/scanner/descriptors/manifest/resourceRouteGroupDescriptor.ts',
  'packages/core/src/compiler/scanner/semanticTypeConstructionRelations.ts',
];

const filesOf = entry => {
  const absolute = path.resolve(entry);
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [entry];
  const out = [];
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(item => {
    const next = path.join(dir, item.name);
    if (item.isDirectory()) walk(next);
    else if (item.isFile() && next.endsWith('.ts') && !next.endsWith('.test.ts') && !next.endsWith('.spec.ts')) out.push(path.relative(process.cwd(), next));
  });
  walk(absolute);
  return out;
};

const files = roots.flatMap(filesOf);
const empty = () => ({ if: 0, for: 0, while: 0, switch: 0, map: 0, filter: 0, reduce: 0, flatMap: 0, undefined: 0, null: 0, nullish: 0, strictEqual: 0, strictNotEqual: 0, asUnknown: 0, set: 0, mapType: 0, any: 0, new: 0 });
const rows = files.map(file => {
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const counts = empty();
  const visit = node => {
    counts.if += Number(node.kind === ts.SyntaxKind.IfStatement);
    counts.for += Number(node.kind === ts.SyntaxKind.ForStatement || node.kind === ts.SyntaxKind.ForInStatement || node.kind === ts.SyntaxKind.ForOfStatement);
    counts.while += Number(node.kind === ts.SyntaxKind.WhileStatement || node.kind === ts.SyntaxKind.DoStatement);
    counts.switch += Number(node.kind === ts.SyntaxKind.SwitchStatement);
    counts.new += Number(node.kind === ts.SyntaxKind.NewExpression);
    counts.strictEqual += Number(node.kind === ts.SyntaxKind.EqualsEqualsEqualsToken);
    counts.strictNotEqual += Number(node.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken);
    counts.nullish += Number(node.kind === ts.SyntaxKind.QuestionQuestionToken);
    counts.asUnknown += Number(node.kind === ts.SyntaxKind.AsExpression && node.type.kind === ts.SyntaxKind.UnknownKeyword);
    counts.any += Number(node.kind === ts.SyntaxKind.AnyKeyword);
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const name = node.expression.name.text;
      counts.map += Number(name === 'map');
      counts.filter += Number(name === 'filter');
      counts.reduce += Number(name === 'reduce');
      counts.flatMap += Number(name === 'flatMap');
    }
    if (node.kind === ts.SyntaxKind.Identifier) {
      counts.undefined += Number(node.text === 'undefined');
      counts.set += Number(node.text === 'Set');
    }
    if (node.kind === ts.SyntaxKind.TypeReference) counts.mapType += Number(node.typeName.getText(sf) === 'Map');
    if (node.kind === ts.SyntaxKind.NullKeyword) counts.null += 1;
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { file, counts };
});
const aggregate = Object.fromEntries(Object.keys(empty()).map(key => [key, rows.reduce((sum, row) => sum + row.counts[key], 0)]));
const report = Object.freeze({ phase: 591, method: 'typescript-ast', scope: roots, files: rows.length, aggregate, rows });
fs.writeFileSync('docs/PHASE591_SCANNER_CONSTRUCTION_FRONTIER_AUDIT.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
