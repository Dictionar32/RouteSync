const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/symbols/resource/index.ts'), 'utf8');
const types = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/symbols/resource/resourceBindingTypes.ts'), 'utf8');
const publicIndex = fs.readFileSync(path.join(root, 'packages/core/src/index.ts'), 'utf8');
const checks = {
  singleCanonicalBarrelExport: /export\s*\{[\s\S]*ResourceModelBindingSource,[\s\S]*type MonoModelBinding/.test(index) && !/ResourceModelBindingSource,\s*type ResourceModelBindingSource/.test(index),
  canonicalValueAndTypeDefinition: /export type ResourceModelBindingSource\s*=/.test(types) && /export const ResourceModelBindingSource\s*=/.test(types),
  publicValueExportOnly: /ResourceModelBindingSource,\n  type MonoModelBinding/.test(publicIndex) && !/ResourceModelBindingSource,\n\s*type ResourceModelBindingSource/.test(publicIndex),
  noParsedLegacyAlias: !/ParsedResourceModelBindingSource|LegacyResourceModelBindingSource/.test(types),
};
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const result = { phase: 718, checks, pass: failed.length === 0, failed };
console.log(JSON.stringify(result, null, 2));
process.exit(failed.length ? 1 : 0);
