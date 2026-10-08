const fs = require('node:fs');
const source = fs.readFileSync('packages/core/src/compiler/scanner/LaravelSourceLexer.ts', 'utf8');
const runtimeImport = source.match(/import\s*\{([\s\S]*?)\}\s*from\s*["']\.\/lexer["']/);
const typeImport = source.match(/import\s+type\s*\{([\s\S]*?)\}\s*from\s*["']\.\/lexer["']/);
const runtimeNames = runtimeImport ? runtimeImport[1].split(',').map(x => x.trim()).filter(Boolean) : [];
const typeNames = typeImport ? typeImport[1].split(',').map(x => x.trim()).filter(Boolean) : [];
const duplicates = runtimeNames.filter(name => typeNames.includes(name));
const checks = [
  ['ParsedPhpArrayResult is not imported as a runtime value', !runtimeNames.includes('ParsedPhpArrayResult')],
  ['ParsedPhpArrayResult remains available as a type', typeNames.includes('ParsedPhpArrayResult')],
  ['runtime and type imports from lexer do not redeclare names', duplicates.length === 0],
];
for (const [name, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
console.log(`RESULT ${checks.filter(([, pass]) => pass).length}/${checks.length} passed; ${checks.filter(([, pass]) => !pass).length} failed`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
