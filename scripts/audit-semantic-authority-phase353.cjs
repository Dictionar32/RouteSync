const fs = require('fs');
const path = require('path');

const roots = [
  'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts',
  'packages/core/src/compiler/constraints/solver/declarativeConstraintProgram.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
  'packages/core/src/semantic/plugins/expression/binaryHandler.ts',
  'packages/core/src/semantic/plugins/expression/literalHandler.ts',
  'packages/core/src/semantic/plugins/expression/property-access/index.ts',
  'packages/core/src/semantic/kernel/semanticNullAtom.ts',
];

const forbidden = /\b(?:if|for|while|switch|map|filter|reduce|flatMap|undefined)\b|\?\?|===|!==|\bas\b/g;
const strip = source => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*/g, '')
  .replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, '');

const violations = roots.flatMap(file => {
  const source = strip(fs.readFileSync(path.resolve(file), 'utf8'));
  const matches = source.match(forbidden) || [];
  return matches.length ? [{ file, count: matches.length, matches }] : [];
});

const report = { phase: 353, files: roots.length, violations };
console.log(JSON.stringify(report, null, 2));
process.exitCode = violations.length ? 1 : 0;
