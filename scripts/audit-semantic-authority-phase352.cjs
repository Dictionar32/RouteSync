const fs = require('fs');
const path = require('path');
const root = process.cwd();
const targets = [
  'packages/core/src/semantic/kernel',
  'packages/core/src/compiler/constraints/solver',
  'packages/core/src/compiler/scanner/lexer/routeAst',
  'packages/core/src/semantic/plugins/expression',
];
const forbidden = /\b(?:if|for|while|switch|map|filter|reduce|flatMap|undefined|null|as)\b|\?\?|===|!==/g;
const skip = /(?:\.test\.|PHASE\d+|\.md$)/i;
const files = [];
const violations = [];
function walk(dir) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel);
    else if (/\.(ts|tsx)$/.test(entry.name) && !skip.test(entry.name)) files.push(rel);
  }
}
targets.forEach(walk);
for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
  const hits = source.match(forbidden) || [];
  if (hits.length) violations.push({ file, count: hits.length });
}
const result = { phase: 352, files: files.length, violations };
console.log(JSON.stringify(result, null, 2));
process.exitCode = violations.length ? 1 : 0;
