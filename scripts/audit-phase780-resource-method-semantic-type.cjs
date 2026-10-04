const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'packages/core/src/types/domain/resourceModelMethodResolver.ts');
const text = fs.readFileSync(file, 'utf8');
const checks = {
  canonicalPrimitiveFactoryImport: /\bprimitiveType\b/.test(text) && /from ['"]\.\.\/\.\.\/compiler\/types\/SemanticType['"]/.test(text),
  noMissingPrimitiveFactory: !/PrimitiveKind\.[A-Z]+\(\)/.test(text),
  noParsedDescriptor: !/Parsed[A-Za-z]*Descriptor/.test(text),
  noFreeUnknown: !/\bunknown\b/.test(text),
  noFreeAny: !/\bany\b/.test(text),
  noFreeUndefined: !/\bundefined\b/.test(text),
};
console.log(JSON.stringify({ phase: 780, file: path.relative(root, file), checks, allPass: Object.values(checks).every(Boolean) }, null, 2));
process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
