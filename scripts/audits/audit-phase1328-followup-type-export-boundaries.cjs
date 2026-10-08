const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const validation = read('packages/core/src/compiler/scanner/descriptors/validationDescriptors.ts');
const compiler = read('packages/core/src/compiler/index.ts');
const checks = [
  ['ScannedRouteValidationRuleParams is imported type-only', /type ScannedRouteValidationRuleParams/.test(validation)],
  ['ArtifactMetadata is exported type-only', /type ArtifactMetadata/.test(compiler)],
  ['ArtifactRegistry is exported type-only', /export type \{[\s\S]*?ArtifactRegistry/.test(compiler)],
  ['ArtifactKey is exported type-only', /export type \{[\s\S]*?ArtifactKey/.test(compiler)],
  ['ArtifactStorage is exported type-only', /export type \{[\s\S]*?ArtifactStorage/.test(compiler)],
];
let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
  if (!ok) failed++;
}
console.log(`RESULT ${checks.length - failed}/${checks.length} passed; ${failed} failed`);
process.exitCode = failed ? 1 : 0;
