const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  'packages/core/src/semantic/kernel/syntax/relationalSyntaxCursor.ts',
  'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/semantic/kernel/requirementSolver.ts',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
];
const patterns = [
  ['void-zero', /void\s+0/g],
  ['undefined-token', /\bundefined\b/g],
  ['nullish-coalesce', /\?\?/g],
  ['strict-equality', /===|!==/g],
  ['synthetic-unknown-token', /kind:\s*['"]unknown['"]/g],
];
const result = { phase: 374, files: {}, violations: [] };
for (const relative of files) {
  const absolute = path.join(root, relative);
  const source = fs.readFileSync(absolute, 'utf8');
  const counts = Object.fromEntries(patterns.map(([name, re]) => [name, (source.match(re) || []).length]));
  result.files[relative] = counts;
  for (const [name, count] of Object.entries(counts)) {
    if (count) result.violations.push({ file: relative, rule: name, count });
  }
}
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.violations.length ? 1 : 0;
