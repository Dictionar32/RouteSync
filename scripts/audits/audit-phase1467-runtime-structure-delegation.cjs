const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const runtimePath = path.join(root, 'packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const checks = [
  ['runtime imports canonical token structure authority', /import \{ scannerTokenStructureInterface, type TokenOccurrenceEvidence \} from '\.\.\/\.\.\/\.\.\/types\/upstream\/scannerTokenStructureAlgebra';/.test(runtime)],
  ['top-level split delegates delimiter and separator reasoning', /function splitTopLevel\([\s\S]*?scannerTokenStructureInterface\.locateTopLevelCandidates/.test(runtime)],
  ['top-level split no longer owns recursive depth scanner', !/function splitTopLevel\([\s\S]*?const step = \(index: number, start: number, depth: number/.test(runtime)],
  ['parenthesis matching delegates to shared delimiter interface', /function matchingClose\([\s\S]*?scannerTokenStructureInterface\.matchLeadingDelimiter/.test(runtime)],
  ['brace matching delegates to shared delimiter interface', /function matchingBrace\([\s\S]*?scannerTokenStructureInterface\.matchLeadingDelimiter/.test(runtime)],
  ['delimiter helpers no longer recursively scan tokens', !/function matchingClose\([\s\S]*?matchingClose\(tokens, openIndex,/.test(runtime) && !/function matchingBrace\([\s\S]*?matchingBrace\(tokens, openIndex,/.test(runtime)],
  ['match AST projection delegates to match expression algebra', /function classifyMatch\([\s\S]*?scannerMatchExpressionAlgebra\.resolve/.test(runtime)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
