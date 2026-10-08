const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['ResponseDescriptorBase is exported as a type from the core entry', /type ResponseDescriptorBase,/.test(read('packages/core/src/index.ts'))],
  ['composeUpstreamWiring resolves to its value-owning module', /export \{ composeUpstreamWiring \} from '\.\/types\/interfaces\/interfaceComposition'/.test(read('packages/core/src/index.ts'))],
  ['interfaces barrel exports composeUpstreamWiring', /export \{ composeUpstreamWiring \} from '\.\/interfaceComposition'/.test(read('packages/core/src/types/interfaces/index.ts'))],
  ['PrimitiveType is exported as a type', /export type \{[\s\S]*?PrimitiveType,[\s\S]*?\} from '\.\/types\/domain\/semanticType'/.test(read('packages/core/src/index.ts'))],
  ['ResolvedPhpType is exported as a type', /export type \{ ResolvedPhpType, ResolvedPhpTypeVisitor \}/.test(read('packages/core/src/index.ts'))],
  ['CompilerValidationError is exported as a type', /export type \{ CompilerValidationError \} from '\.\/compiler\/diagnostics'/.test(read('packages/core/src/index.ts'))],
  ['DiagnosticBag remains a runtime export', /export \{[\s\S]*?DiagnosticBag,[\s\S]*?\} from '\.\/compiler\/diagnostics'/.test(read('packages/core/src/index.ts'))],
  ['syntaxRange has a single relationResolve import', (read('packages/core/src/compiler/scanner/lexer/routeAst/syntaxRange.ts').match(/relationResolve/g) || []).length >= 1 && (read('packages/core/src/compiler/scanner/lexer/routeAst/syntaxRange.ts').match(/import[^;]*relationResolve[^;]*from/g) || []).length === 1],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length} passed; ${failures} failed\n`);
process.exitCode = failures ? 1 : 0;
