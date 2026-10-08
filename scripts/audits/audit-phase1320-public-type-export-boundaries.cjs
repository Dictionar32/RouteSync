const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const checks = [
  ['route barrel exports the runtime relation vocabulary from its owner', 'packages/core/src/types/route.ts', 'export { EloquentRelationType } from "./upstream/modelVocabulary";'],
  ['route barrel keeps ResponseDescriptorBase type-only', 'packages/core/src/types/route.ts', 'type ResponseDescriptorBase,'],
  ['domain barrel re-exports runtime EloquentRelationType from upstream', 'packages/core/src/types/domain/index.ts', "export { EloquentRelationType } from '../upstream/modelVocabulary';"],
  ['domain barrel keeps ResponseDescriptorBase type-only', 'packages/core/src/types/domain/index.ts', 'type ResponseDescriptorBase,'],
  ['SymbolTable API is exported as types, not runtime values', 'packages/core/src/index.ts', "export type { SymbolTable, ModelSymbol } from './semantic/SymbolTable'"],
  ['core entry exports SourceStream as a type', 'packages/core/src/index.ts', 'type SourceStream,'],
  ['compiler entry exports SourceStream as a type', 'packages/core/src/compiler/index.ts', 'type SourceStream,'],
  ['lexer barrel exports SourceStream as a type', 'packages/core/src/compiler/scanner/lexer/index.ts', 'export type { SourceStream } from "./SourceStream";'],
  ['LaravelSourceLexer exports SourceStream as a type', 'packages/core/src/compiler/scanner/LaravelSourceLexer.ts', '    SourceStream,'],
];
let failed = 0;
for (const [label, relative, needle] of checks) {
  const content = fs.readFileSync(path.join(root, relative), 'utf8');
  const pass = content.includes(needle);
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!pass) failed += 1;
}
const syntaxRange = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/syntaxRange.ts'), 'utf8');
const duplicateImport = (syntaxRange.match(/import\s*\{[^}]*\brelationResolve\b[^}]*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/relational\/sequence['"];?/g) || []).length;
const pass = duplicateImport <= 1;
process.stdout.write(`${pass ? 'PASS' : 'FAIL'} syntaxRange has no duplicate relationResolve import (${duplicateImport})\n`);
if (!pass) failed += 1;
process.stdout.write(`RESULT ${checks.length + 1 - failed}/${checks.length + 1} passed; ${failed} failed\n`);
process.exitCode = failed ? 1 : 0;
