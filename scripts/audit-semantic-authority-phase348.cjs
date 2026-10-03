const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/semantic/kernel/semanticConstructProgram.ts',
  'packages/core/src/semantic/kernel/syntax/presenceRelations.ts',
  'packages/core/src/semantic/kernel/syntax/relationalCursorAuthority.ts',
  'packages/core/src/compiler/constraints/solver/declarativeConstraintProgram.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/parserAdapterRelations.ts',
];
const bad = /\b(if|while|for|switch|undefined|null)\b|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\?\?|===|!==|\bas\b/g;
const violations = [];
for (const rel of files) {
  const file = path.join(root, rel);
  const src = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
  for (const match of src.matchAll(bad)) violations.push({ file: rel, token: match[0], index: match.index });
}
console.log(JSON.stringify({ phase: 348, violations }, null, 2));
process.exitCode = violations.length ? 1 : 0;
