const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve('packages/core/src');
const selected = [
  'compiler/types/SemanticType.ts',
  'compiler/analysis/AnalysisManager.ts',
  'compiler/analysis/PassAnalysisStore.ts',
  'compiler/analysis/UseDefAnalysis.ts',
  'compiler/analysis/manager/dependencyGraph.ts',
  'compiler/scanner/resolvers/RouteSecurityResolver.ts',
  'compiler/scanner/resolvers/resource/ResourceModelResolver.ts',
  'compiler/domain/common/typeExpressionSemanticRelations.ts',
  'semantic/kernel/relationMembership.ts',
];
const sourceFiles = [];
function collect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) collect(p);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.spec.ts')) sourceFiles.push(p);
  }
}
collect(root);

const counts = () => ({ if: 0, while: 0, for: 0, switch: 0, map: 0, filter: 0, reduce: 0, flatMap: 0, undefined: 0, null: 0, '??': 0, '===': 0, '!==': 0, 'as unknown': 0, Set: 0, Map: 0, any: 0, new: 0, ternary: 0 });
function audit(file) {
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const c = counts();
  function visit(node) {
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
      if (n in {map:1,filter:1,reduce:1,flatMap:1}) c[n]++;
    }
    if (node.kind === ts.SyntaxKind.UndefinedKeyword || (ts.isIdentifier(node) && node.text === 'undefined')) c.undefined++;
    if (node.kind === ts.SyntaxKind.NullKeyword) c.null++;
    if (node.kind === ts.SyntaxKind.AnyKeyword) c.any++;
    if (ts.isIdentifier(node) && node.text === 'Set') c.Set++;
    if (ts.isIdentifier(node) && node.text === 'Map') c.Map++;
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return c;
}
function merge(a,b){for(const k of Object.keys(a)) a[k]+=b[k]; return a;}
const global = counts(); const nonzero=[];
for (const f of sourceFiles) { const c=audit(f); const n=Object.values(c).reduce((a,b)=>a+b,0); if(n) nonzero.push({file:path.relative(root,f), total:n, counts:c}); merge(global,c); }
nonzero.sort((a,b)=>b.total-a.total);
const selectedAudit = Object.fromEntries(selected.map(rel=>[rel,audit(path.join(root,rel))]));
const report = { phase:596, productionFiles:sourceFiles.length, selected:selectedAudit, global, top:nonzero.slice(0,100) };
fs.writeFileSync('docs/PHASE596_RELATIONAL_FRONTIER_AUDIT.json', JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
