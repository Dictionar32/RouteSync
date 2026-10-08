const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const typeIndex = read('packages/core/src/compiler/types/index.ts');
const compilerIndex = read('packages/core/src/compiler/index.ts');
const checks = [
  ['SemanticTypeBase is re-exported type-only', /export type \{[\s\S]*?SemanticTypeBase[\s\S]*?\} from '\.\/SemanticType'/.test(typeIndex)],
  ['PrimitiveType is re-exported type-only', /export type \{[\s\S]*?PrimitiveType[\s\S]*?\} from '\.\/SemanticType'/.test(typeIndex)],
  ['GenericVariance and GenericParameter are re-exported type-only', /export type \{[\s\S]*?GenericVariance[\s\S]*?GenericParameter[\s\S]*?\} from '\.\/SemanticType'/.test(typeIndex)],
  ['SemanticType is re-exported type-only', /export type \{[\s\S]*?SemanticType[\s\S]*?\} from '\.\/SemanticType'/.test(typeIndex)],
  ['FileSpan source-location contracts are type-only', /export type \{ FileSpan, SourceRange, ASTBaseNode \} from '\.\/FileSpan'/.test(typeIndex)],
  ['ResolvedPhpType algebra and visitor are type-only', /export type \{ ResolvedPhpType, ResolvedPhpTypeVisitor \} from '\.\/ResolvedPhpType'/.test(typeIndex)],
  ['Compiler barrel exports semantic contracts type-only', /export type \{[\s\S]*?SemanticTypeBase[\s\S]*?PrimitiveType[\s\S]*?GenericVariance[\s\S]*?GenericParameter[\s\S]*?SemanticType[\s\S]*?HashContext[\s\S]*?TypeHierarchy[\s\S]*?\} from '\.\/types'/.test(compilerIndex)],
  ['Runtime semantic constructors remain runtime exports', /export \{[\s\S]*?PrimitiveKind[\s\S]*?SemanticTypeKind[\s\S]*?NeverType[\s\S]*?ObjectType[\s\S]*?\} from '\.\/types'/.test(compilerIndex)],
  ['Legacy StaticLaravelScanner remains retired', read('packages/core/src/compiler/scanner/StaticLaravelScanner.ts').trim() === ''],
];
let failed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed++;
}
process.stdout.write(`Phase 1336 audit: ${checks.length - failed}/${checks.length} passed\n`);
if (failed) process.exitCode = 1;
