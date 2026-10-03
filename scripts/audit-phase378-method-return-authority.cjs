const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/semantic/EloquentRegistry.ts',
  'packages/core/src/semantic/plugins/method-return/instanceMethodSupport.ts',
  'packages/core/src/semantic/plugins/method-return/instanceMethodResolver.ts',
  'packages/core/src/semantic/plugins/method-return/instanceMethodResolution.ts',
  'packages/core/src/semantic/plugins/method-return/staticMethodResolver.ts',
  'packages/core/src/semantic/plugins/method-return/selectRawProjection.ts',
];
const counts = Object.fromEntries(files.map(f => [f, {if:0,for:0,while:0,switch:0,map:0,filter:0,reduce:0,flatMap:0,undefined:0,null:0,questionQuestion:0,strictEqual:0,strictNotEqual:0,as:0,unknown:0}]));
for (const file of files) {
  const p = path.join(root, file);
  const sf = ts.createSourceFile(p, fs.readFileSync(p, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const c = counts[file];
  function visit(n) {
    if (n.kind === ts.SyntaxKind.IfStatement) c.if++;
    if (n.kind === ts.SyntaxKind.ForStatement || n.kind === ts.SyntaxKind.ForInStatement || n.kind === ts.SyntaxKind.ForOfStatement) c.for++;
    if (n.kind === ts.SyntaxKind.WhileStatement || n.kind === ts.SyntaxKind.DoStatement) c.while++;
    if (n.kind === ts.SyntaxKind.SwitchStatement) c.switch++;
    if (n.kind === ts.SyntaxKind.AsExpression || n.kind === ts.SyntaxKind.TypeAssertionExpression) c.as++;
    if (n.kind === ts.SyntaxKind.NullKeyword) c.null++;
    if (n.kind === ts.SyntaxKind.Identifier && n.text === 'undefined') c.undefined++;
    if (n.kind === ts.SyntaxKind.Identifier && n.text === 'unknown') c.unknown++;
    if (n.kind === ts.SyntaxKind.BinaryExpression) {
      if (n.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) c.questionQuestion++;
      if (n.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) c.strictEqual++;
      if (n.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) c.strictNotEqual++;
    }
    if (n.kind === ts.SyntaxKind.CallExpression && n.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
      const name = n.expression.name.text;
      if (['map','filter','reduce','flatMap'].includes(name)) c[name]++;
    }
    ts.forEachChild(n, visit);
  }
  visit(sf);
}
const violations = Object.entries(counts).flatMap(([file, c]) => Object.entries(c).filter(([,v]) => v !== 0).map(([k,v]) => ({file,k,v})));
const result = { phase: 378, files, counts, violations };
console.log(JSON.stringify(result, null, 2));
if (violations.length) process.exit(1);
