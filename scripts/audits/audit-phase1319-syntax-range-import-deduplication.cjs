const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const sourcePath = path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/syntaxRange.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const imports = source.match(/^import\s+\{[^\n]*\}\s+from\s+'\.\.\/\.\.\/\.\.\/relational\/sequence';$/gm) ?? [];
const duplicateStandaloneImport = /^import\s+\{\s*relationResolve\s*\}\s+from\s+'\.\.\/\.\.\/\.\.\/relational\/sequence';$/m.test(source);
const hasUnifiedImport = /import\s+\{[^\n]*\brelationResolve\b[^\n]*\}\s+from\s+'\.\.\/\.\.\/\.\.\/relational\/sequence';/m.test(source);
const checks = [
  ['one relational-sequence import in syntaxRange', imports.length === 1],
  ['relationResolve is included in unified import', hasUnifiedImport],
  ['standalone duplicate relationResolve import removed', !duplicateStandaloneImport],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase 1319 syntax-range import audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
