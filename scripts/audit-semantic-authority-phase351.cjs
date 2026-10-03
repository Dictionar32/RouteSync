const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/compiler/scanner/lexer/routeAst/delimiterNavigation.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxScan.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationParser.ts',
  'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
];
const forbidden = ['if','for','while','switch','map','filter','reduce','flatMap','undefined','null','===','!==','as','??'];
const violations = [];
for (const rel of files) {
  const source = fs.readFileSync(path.join(root, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  for (const token of forbidden) {
    const count = (source.match(new RegExp(`(?<![A-Za-z0-9_$])${token.replace(/[?]/g, '\\$&')}(?![A-Za-z0-9_$])`, 'g')) || []).length;
    if (count) violations.push({ file: rel, token, count });
  }
}
process.stdout.write(JSON.stringify({ phase: 351, files: files.length, violations }, null, 2) + '\n');
process.exitCode = violations.length ? 1 : 0;
