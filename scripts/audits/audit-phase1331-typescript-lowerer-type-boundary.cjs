const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const lowerer = read('packages/core/src/compiler/domain/common/TypeScriptTypeLowerer.ts');
const checks = [
  ['TypeScriptLowererOptions is imported type-only', /type TypeScriptLowererOptions/.test(lowerer)],
  ['TypeScriptPrimitiveToken is imported type-only', /type TypeScriptPrimitiveToken/.test(lowerer)],
  ['GeneratedInterfaceMetadata is imported type-only', /type GeneratedInterfaceMetadata/.test(lowerer)],
  ['LoweredTypeDeclaration is imported type-only', /type LoweredTypeDeclaration/.test(lowerer)],
  ['TypeScriptBuildResult is imported type-only', /type TypeScriptBuildResult/.test(lowerer)],
  ['TypeScriptLowererOptions is exported type-only', /type TypeScriptLowererOptions/.test(lowerer)],
  ['TypeScriptPrimitiveToken is exported type-only', /type TypeScriptPrimitiveToken/.test(lowerer)],
  ['metadata contracts are exported type-only', /type GeneratedInterfaceMetadata,[\s\S]*type LoweredTypeDeclaration,[\s\S]*type TypeScriptBuildResult/.test(lowerer)],
  ['runtime lowerer primitives remain value imports/exports', /TypeScriptPrimitiveMapping/.test(lowerer) && /TypeScriptCodeBuilder/.test(lowerer) && /TypeScriptSyntax/.test(lowerer)],
];
let failures = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
  if (!pass) failures++;
}
console.log(`${checks.length - failures}/${checks.length} checks passed`);
process.exitCode = failures ? 1 : 0;
