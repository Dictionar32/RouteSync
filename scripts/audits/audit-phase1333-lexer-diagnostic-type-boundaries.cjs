const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['arrayParser imports PhpAst contracts type-only', /import \{ createSourceOffset \} from '\.\/PhpAst';\s*import type \{ TokenDescriptor, PhpArrayEntry, ParsedPhpArrayResult, PhpArrayKey \} from '\.\/PhpAst';/.test(read('packages/core/src/compiler/scanner/lexer/arrayParser.ts'))],
  ['arrayParser retains runtime source-offset factory', /import \{ createSourceOffset \} from '\.\/PhpAst';/.test(read('packages/core/src/compiler/scanner/lexer/arrayParser.ts'))],
  ['SourceStream imports token contracts type-only', /import \{ createSourceLineNumber, createSourceOffset \} from '\.\/PhpAst';\s*import type \{ TokenType, TokenDescriptor \} from '\.\/PhpAst';/.test(read('packages/core/src/compiler/scanner/lexer/SourceStream.ts'))],
  ['Diagnostic public contracts exported type-only', /export type \{\s*Diagnostic,\s*DiagnosticSeverity,\s*DiagnosticFix,\s*TextEdit\s*\} from '\.\/diagnostics';/s.test(read('packages/core/src/compiler/index.ts'))],
  ['DiagnosticBag remains runtime export', /export \{\s*DiagnosticBag\s*\} from '\.\/diagnostics';/s.test(read('packages/core/src/compiler/index.ts'))],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!pass) failures += 1;
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures ? 1 : 0;
