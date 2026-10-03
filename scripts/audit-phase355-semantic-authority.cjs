const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const targets = [
  'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
  'packages/core/src/semantic/plugins/expression/binaryHandler.ts',
  'packages/core/src/semantic/plugins/expression/literalHandler.ts',
  'packages/core/src/semantic/plugins/expression/property-access/index.ts',
];
const erased = [
  'packages/core/src/semantic/plugins/expression/property-access/specialAccessHandler.ts',
  'packages/core/src/semantic/plugins/expression/property-access/targetModelResolver.ts',
];
const forbidden = /\b(?:if|for|while|switch|undefined|null)\b|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\?\?|===|!==|\bas\b/g;
const stripComments = text => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');
const stripQuoted = text => text.replace(/'(?:\\.|[^'\\])*'/g, "''").replace(/\"(?:\\.|[^\"\\])*\"/g, '""').replace(/`(?:\\.|[^`\\])*`/g, '``');
const violations = targets.flatMap(rel => {
  const text = stripQuoted(stripComments(fs.readFileSync(path.join(root, rel), 'utf8')));
  return [...text.matchAll(forbidden)].map(m => ({ file: rel, token: m[0], index: m.index }));
});
const emptyViolations = erased.filter(rel => fs.statSync(path.join(root, rel)).size !== 0);
const result = { phase: 355, authorityFiles: targets.length, erasedFiles: erased.length, violations, nonEmptyErasedFiles: emptyViolations };
console.log(JSON.stringify(result, null, 2));
process.exitCode = violations.length || emptyViolations.length ? 1 : 0;
