const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'packages/core/src/index.ts'), 'utf8');
const bindingIndex = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/symbols/resource/index.ts'), 'utf8');
const source = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/symbols/resource/resourceBindingTypes.ts'), 'utf8');
const checks = {
  singleValueExport: /\n  ResourceModelBindingSource,\n  type MonoModelBinding/.test(index),
  noDuplicateTypeExport: !/ResourceModelBindingSource,\n\s*type ResourceModelBindingSource/.test(index),
  canonicalModuleValueAndType: /export type ResourceModelBindingSource[\s\S]*export const ResourceModelBindingSource/.test(source),
  canonicalResourceIndex: /ResourceModelBindingSource,\n    type MonoModelBinding/.test(bindingIndex),
  noLegacyAlias: !/LegacyResourceModelBindingSource|ParsedResourceModelBindingSource/.test(source),
};
const exportBlock = index.match(/export \{[\s\S]*?\} from '\.\/compiler\/scanner\/symbols\/resource';/)?.[0] ?? '';
const exportChecks = { noControlFlowInExportBlock: !/\b(?:if|while|for|switch)\b|\.(?:map|filter|reduce|flatMap)\(/.test(exportBlock) };
const pass = Object.values(checks).every(Boolean) && Object.values(exportChecks).every(Boolean);
console.log(JSON.stringify({phase:717, checks:{...checks,...exportChecks}, pass, failed:[...Object.entries({...checks,...exportChecks}).filter(([,v])=>!v).map(([k])=>k)]}, null, 2));
process.exit(pass ? 0 : 1);
