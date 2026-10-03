const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const root = path.resolve(__dirname, '..');
const targets = [
  'packages/core/src/types/domain/boundAst.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
  'packages/core/src/compiler/scanner/resolvers/RouteDomainResolver.ts',
  'packages/core/src/compiler/scanner/resolvers/RouteSecurityResolver.ts',
  'packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts',
  'packages/core/src/types/upstream/astSemanticInterface.ts',
  'packages/core/src/types/upstream/astMappingInterface.ts',
];
const sourceText = file => fs.readFileSync(path.join(root, file), 'utf8');
const syntaxCounts = source => {
  const sf = ts.createSourceFile('frontier.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const counts = { if:0, for:0, while:0, switch:0, map:0, filter:0, reduce:0, flatMap:0, undefined:0, null:0, strictEquality:0, asUnknown:0, any:0, new:0 };
  const visit = node => {
    if (node.kind === ts.SyntaxKind.IfStatement) counts.if++;
    if (node.kind === ts.SyntaxKind.ForStatement || node.kind === ts.SyntaxKind.ForOfStatement || node.kind === ts.SyntaxKind.ForInStatement) counts.for++;
    if (node.kind === ts.SyntaxKind.WhileStatement || node.kind === ts.SyntaxKind.DoStatement) counts.while++;
    if (node.kind === ts.SyntaxKind.SwitchStatement) counts.switch++;
    if (node.kind === ts.SyntaxKind.NewExpression) counts.new++;
    if (node.kind === ts.SyntaxKind.AsExpression && node.type.kind === ts.SyntaxKind.UnknownKeyword) counts.asUnknown++;
    if (node.kind === ts.SyntaxKind.BinaryExpression && node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) counts.strictEquality++;
    if (node.kind === ts.SyntaxKind.Identifier && node.text === 'undefined') counts.undefined++;
    if (node.kind === ts.SyntaxKind.NullKeyword) counts.null++;
    if (node.kind === ts.SyntaxKind.AnyKeyword) counts.any++;
    if (ts.isPropertyAccessExpression(node) && ['map','filter','reduce','flatMap'].includes(node.name.text) && node.parent.kind === ts.SyntaxKind.CallExpression) counts[node.name.text]++;
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return counts;
};
const files = Object.fromEntries(targets.map(file => [file, syntaxCounts(sourceText(file))]));
const failed = Object.entries(files).flatMap(([file, counts]) => Object.entries(counts).filter(([, value]) => value > 0).map(([kind, value]) => `${file}:${kind}=${value}`));
console.log(JSON.stringify({ phase:714, kind:'semantic-frontier-ast-audit', files, pass: failed.length === 0, remaining: failed }, null, 2));
process.exitCode = 0;
