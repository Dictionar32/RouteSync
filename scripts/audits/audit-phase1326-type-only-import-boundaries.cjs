const fs = require('node:fs');
const checks = [
  ['ApiFieldOutput imported as type', 'packages/core/src/compiler/passes/ApiFieldGeneratorPass.ts', /import type \{ ApiFieldOutput \} from '\.\/outputLowerers';/],
  ['TypeScriptLowererOptions imported as type', 'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptNodeLowerer.ts', /import type \{ TypeScriptLowererOptions \} from '\.\/typeScriptVocabulary';/],
  ['Zod lowerer semantic contracts are type-only', 'packages/core/src/compiler/domain/common/ZodSchemaLowerer.ts', /type ResolvedSemanticType,[\s\S]*type ResolvedObjectType,[\s\S]*type ResolvedPrimitiveKind,[\s\S]*matchResolvedSemanticType/],
  ['PrimitiveType imported as type in type-expression lowering', 'packages/core/src/types/domain/typeExpressionSemanticType.ts', /type PrimitiveType/],
  ['runtime type matcher remains a value import', 'packages/core/src/compiler/domain/common/ZodSchemaLowerer.ts', /matchResolvedSemanticType/],
];
let failed = 0;
for (const [label, file, pattern] of checks) {
  const source = fs.readFileSync(file, 'utf8');
  const pass = pattern.test(source);
  console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
  if (!pass) failed++;
}
console.log(`RESULT ${checks.length - failed}/${checks.length} passed; ${failed} failed`);
process.exitCode = failed ? 1 : 0;
