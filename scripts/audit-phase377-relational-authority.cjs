const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/semantic/SemanticResolutionKernel.ts',
  'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
  'packages/core/src/semantic/kernel/requirementSolver.ts',
  'packages/core/src/semantic/kernel/semanticDecisionEngine.ts',
];

const forbidden = Object.fromEntries([
  ['if', 0], ['for', 0], ['while', 0], ['switch', 0],
  ['map', 0], ['filter', 0], ['reduce', 0], ['flatMap', 0],
  ['undefined', 0], ['null', 0], ['strictEqual', 0], ['strictNotEqual', 0],
  ['as', 0], ['unknownType', 0], ['nullish', 0],
].map(([k]) => [k, 0]));
const violations = [];

function walk(node, file) {
  if (ts.isIfStatement(node)) violations.push([file, 'if']);
  if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) violations.push([file, 'for']);
  if (ts.isWhileStatement(node) || ts.isDoStatement(node)) violations.push([file, 'while']);
  if (ts.isSwitchStatement(node)) violations.push([file, 'switch']);
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
    const n = node.expression.name.text;
    if (['map','filter','reduce','flatMap'].includes(n)) violations.push([file, n]);
  }
  if (ts.isIdentifier(node) && node.text === 'undefined') violations.push([file, 'undefined']);
  if (ts.isBinaryExpression(node)) {
    if (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) violations.push([file, 'strictEqual']);
    if (node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) violations.push([file, 'strictNotEqual']);
    if (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) violations.push([file, 'nullish']);
  }
  if (ts.isAsExpression(node)) violations.push([file, 'as']);
  if (ts.isTypeReferenceNode(node) && node.typeName.getText() === 'unknown') violations.push([file, 'unknownType']);
  if (node.kind === ts.SyntaxKind.NullKeyword) violations.push([file, 'null']);
  ts.forEachChild(node, child => walk(child, file));
}

for (const rel of files) {
  const file = path.join(root, rel);
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  walk(sf, rel);
}
for (const [, kind] of violations) forbidden[kind]++;
console.log(JSON.stringify({ phase: 377, files: files.length, forbidden, violations }, null, 2));
process.exitCode = violations.length ? 1 : 0;
