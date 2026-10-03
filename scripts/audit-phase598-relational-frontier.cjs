const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const root = path.resolve('packages/core/src');
const selected = [
  'compiler/scanner/LaravelSourceLexer.ts',
  'compiler/scanner/lexer/tokenizer.ts',
  'compiler/scanner/upstream/route/routeGroupSemanticResolver.ts',
  'compiler/analysis/dominator/dominatorTree.ts',
  'compiler/analysis/dominator/dominatorRpo.ts',
  'compiler/analysis/dominator/dominatorIntersect.ts',
  'compiler/analysis/dominator/dominanceFrontier.ts',
  'compiler/analysis/DominatorAnalysis.ts',
  'types/domain/semanticCollections.ts',
  'semantic/kernel/relationMembership.ts',
];
const sourceFiles = [];
const collect = dir => fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
  const file = path.join(dir, entry.name);
  if (entry.isDirectory()) return collect(file);
  if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.spec.ts')) sourceFiles.push(file);
});
collect(root);
const counts = () => ({ if:0, while:0, for:0, switch:0, map:0, filter:0, reduce:0, flatMap:0, undefined:0, null:0, '??':0, '===':0, '!==':0, 'as unknown':0, Set:0, Map:0, any:0, new:0, ternary:0 });
const audit = file => {
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const c = counts();
  const visit = node => {
    if (ts.isIfStatement(node)) c.if++;
    if (ts.isWhileStatement(node)) c.while++;
    if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) c.for++;
    if (ts.isSwitchStatement(node)) c.switch++;
    if (ts.isConditionalExpression(node)) c.ternary++;
    if (ts.isNewExpression(node)) c.new++;
    if (ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.UnknownKeyword) c['as unknown']++;
    if (ts.isBinaryExpression(node)) {
      const op = node.operatorToken.kind;
      if (op === ts.SyntaxKind.EqualsEqualsEqualsToken) c['===']++;
      if (op === ts.SyntaxKind.ExclamationEqualsEqualsToken) c['!==']++;
      if (op === ts.SyntaxKind.QuestionQuestionToken) c['??']++;
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const n = node.expression.name.text;
      if (n === 'map' || n === 'filter' || n === 'reduce' || n === 'flatMap') c[n]++;
    }
    if (node.kind === ts.SyntaxKind.UndefinedKeyword || (ts.isIdentifier(node) && node.text === 'undefined')) c.undefined++;
    if (node.kind === ts.SyntaxKind.NullKeyword) c.null++;
    if (node.kind === ts.SyntaxKind.AnyKeyword) c.any++;
    if (ts.isIdentifier(node) && node.text === 'Set') c.Set++;
    if (ts.isIdentifier(node) && node.text === 'Map') c.Map++;
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return c;
};
const merge = (a,b) => Object.keys(a).forEach(k => { a[k] += b[k]; });
const global = counts();
const nonzero = [];
sourceFiles.forEach(file => {
  const c = audit(file);
  const total = Object.values(c).reduce((a,b) => a+b, 0);
  if (total) nonzero.push({ file:path.relative(root,file), total, counts:c });
  merge(global,c);
});
nonzero.sort((a,b) => b.total-a.total);
const selectedAudit = Object.fromEntries(selected.map(rel => [rel, audit(path.join(root, rel))]));
const emptyProductionFiles = sourceFiles.filter(file => fs.statSync(file).size === 0).map(file => path.relative(root,file));
const report = { phase:598, productionFiles:sourceFiles.length, emptyProductionFiles, selected:selectedAudit, global, top:nonzero.slice(0,100) };
fs.writeFileSync('docs/PHASE598_RELATIONAL_FRONTIER_AUDIT.json', JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
