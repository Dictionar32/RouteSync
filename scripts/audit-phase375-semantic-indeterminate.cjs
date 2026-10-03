const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/types/domain/semanticResolution.ts',
  'packages/core/src/types/domain/semanticResolutionFactory.ts',
  'packages/core/src/semantic/semanticResolutionSupport.ts',
  'packages/core/src/semantic/semanticResolutionToBoundType.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
  'packages/core/src/semantic/plugins/expression/binaryHandler.ts',
  'packages/core/src/semantic/plugins/expression/property-access/index.ts',
  'packages/core/src/semantic/plugins/ExpressionResolver.ts',
  'packages/core/src/semantic/plugins/MethodReturnResolver.ts',
  'packages/core/src/semantic/plugins/PrimitiveResolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts',
];
const forbidden = { if: 0, for: 0, while: 0, switch: 0, map: 0, filter: 0, reduce: 0, flatMap: 0, undefined: 0, null: 0, strictEqual: 0, strictNotEqual: 0, as: 0, unknownType: 0 };
const violations = [];
function add(file, kind, node, sf) {
  forbidden[kind]++;
  const pos = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  violations.push({ file: path.relative(root, file), kind, line: pos.line + 1, text: node.getText(sf) });
}
for (const rel of files) {
  const file = path.join(root, rel);
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const visit = node => {
    if (node.kind === ts.SyntaxKind.IfStatement) add(file, 'if', node, sf);
    if ([ts.SyntaxKind.ForStatement, ts.SyntaxKind.ForInStatement, ts.SyntaxKind.ForOfStatement].includes(node.kind)) add(file, 'for', node, sf);
    if ([ts.SyntaxKind.WhileStatement, ts.SyntaxKind.DoStatement].includes(node.kind)) add(file, 'while', node, sf);
    if (node.kind === ts.SyntaxKind.SwitchStatement) add(file, 'switch', node, sf);
    if (node.kind === ts.SyntaxKind.AsExpression) add(file, 'as', node, sf);
    if (node.kind === ts.SyntaxKind.UnknownKeyword) add(file, 'unknownType', node, sf);
    if (node.kind === ts.SyntaxKind.NullKeyword) add(file, 'null', node, sf);
    if (node.kind === ts.SyntaxKind.Identifier && node.text === 'undefined') add(file, 'undefined', node, sf);
    if (node.kind === ts.SyntaxKind.BinaryExpression) {
      if (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) add(file, 'strictEqual', node.operatorToken, sf);
      if (node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) add(file, 'strictNotEqual', node.operatorToken, sf);
    }
    if (node.kind === ts.SyntaxKind.CallExpression && ts.isPropertyAccessExpression(node.expression)) {
      const name = node.expression.name.text;
      if (['map', 'filter', 'reduce', 'flatMap'].includes(name)) add(file, name, node, sf);
    }
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(sf, visit);
}
const resolutionText = fs.readFileSync(path.join(root, 'packages/core/src/types/domain/semanticResolution.ts'), 'utf8');
if (/kind:\s*'unknown'|status:\s*'unknown'|UnknownSemanticResolution|visitor\.unknown/.test(resolutionText)) {
  violations.push({ file: 'packages/core/src/types/domain/semanticResolution.ts', kind: 'legacy-resolution-unknown', line: 0, text: 'legacy unknown resolution vocabulary remains' });
}
console.log(JSON.stringify({ phase: 375, files: files.length, forbidden, violations }, null, 2));
process.exitCode = violations.length ? 1 : 0;
