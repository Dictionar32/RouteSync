const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxNavigation.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/phpAstSyntaxEvidenceRelationProgram.ts',
];
const violations = files.filter((file) => fs.statSync(path.join(root, file)).size !== 0);
console.log(JSON.stringify({ phase: 354, files: files.length, empty: files.length - violations.length, violations }, null, 2));
process.exitCode = violations.length ? 1 : 0;
