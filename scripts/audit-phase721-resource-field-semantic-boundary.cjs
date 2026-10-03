const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const productionRoots = [
  'packages/core/src',
  'packages/sdk/src',
  'packages/react/src',
  'packages/cli/src',
];

const tsFiles = [];
for (const rootRel of productionRoots) {
  const absolute = path.join(root, rootRel);
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(target);
      else if (entry.isFile() && target.endsWith('.ts')) tsFiles.push(target);
    }
  };
  walk(absolute);
}

const production = tsFiles.map(file => ({ file, source: fs.readFileSync(file, 'utf8') }));
const legacyRefs = production.filter(({ source }) => /ScannedResourceFieldDescriptor|ScannedResourceFieldParams|descriptors\/resourceDescriptors|descriptors\/resource\//.test(source));
const binding = read('packages/core/src/compiler/scanner/semantic/resourceFieldSemanticBinding.ts');
const binder = read('packages/core/src/compiler/scanner/binders/SemanticResourceBinder.ts');
const oldFiles = [
  'packages/core/src/compiler/scanner/descriptors/resource/index.ts',
  'packages/core/src/compiler/scanner/descriptors/resource/resourceDescriptorClass.ts',
  'packages/core/src/compiler/scanner/descriptors/resource/resourceDescriptorTypes.ts',
  'packages/core/src/compiler/scanner/descriptors/resource/resourceFieldDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/resourceDescriptors.ts',
];

const checks = {
  canonicalSemanticBinding: /export interface ResourceFieldSemanticBinding\b/.test(binding),
  canonicalInput: /export interface ResourceFieldSemanticBindingInput\b/.test(binding),
  bindingOwnsSemanticWitness: /readonly semantic: ResourceFieldSemantic;/.test(binding),
  bindingOwnsBoundAst: /readonly boundAst: BoundSemanticNode;/.test(binding),
  binderUsesBinding: /readonly binding: ResourceFieldSemanticBinding;/.test(binder),
  noLegacyProductionRefs: legacyRefs.length === 0,
  legacyDescriptorFilesEmpty: oldFiles.every(rel => fs.statSync(path.join(root, rel)).size === 0),
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([name]) => name);
const report = { phase: 721, checks, legacyRefs: legacyRefs.map(({ file }) => path.relative(root, file)), failed, pass: failed.length === 0 };
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
