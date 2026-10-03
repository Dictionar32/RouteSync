const fs = require('fs');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = '/tmp/rs380';
const files = [
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
  'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts',
  'packages/core/src/compiler/scanner/semantic/route/routeBindingAstAdapter.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxRange.ts',
];
const forbidden = new Map([
  ['if', n => ts.isIfStatement(n)],
  ['for', n => ts.isForStatement(n) || ts.isForOfStatement(n) || ts.isForInStatement(n)],
  ['while', n => ts.isWhileStatement(n) || ts.isDoStatement(n)],
  ['switch', n => ts.isSwitchStatement(n)],
  ['map', n => ts.isPropertyAccessExpression(n) && n.name.text === 'map'],
  ['filter', n => ts.isPropertyAccessExpression(n) && n.name.text === 'filter'],
  ['reduce', n => ts.isPropertyAccessExpression(n) && n.name.text === 'reduce'],
  ['flatMap', n => ts.isPropertyAccessExpression(n) && n.name.text === 'flatMap'],
  ['undefined', n => ts.isIdentifier(n) && n.text === 'undefined'],
  ['??', n => ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken],
  ['null', n => n.kind === ts.SyntaxKind.NullKeyword],
  ['===', n => ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken],
  ['!==', n => ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken],
  ['as', n => ts.isAsExpression(n)],
  ['unknown', n => n.kind === ts.SyntaxKind.UnknownKeyword],
]);
let failed = false;
for (const rel of files) {
  const file = `${root}/${rel}`;
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const counts = Object.fromEntries([...forbidden.keys()].map(k => [k, 0]));
  const walk = node => { for (const [name, test] of forbidden) if (test(node)) counts[name]++; ts.forEachChild(node, walk); };
  walk(sf);
  console.log(`${rel}: ${JSON.stringify(counts)}`);
  if (Object.values(counts).some(v => v !== 0)) failed = true;
}
process.exitCode = failed ? 1 : 0;
