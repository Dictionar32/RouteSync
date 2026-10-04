const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'packages/core/src/types/ir/resolvedSemanticFactory.ts');
const source = fs.readFileSync(file, 'utf8');

const checks = {
  canonicalUnionConstructor: /union:\s*\(types: readonly SemanticType\[\]\): UnionType => UnionType\(types\)/.test(source),
  noArrayPassedToVariadicUnionOf: !/UnionType\.of\(types\)/.test(source),
  canonicalSemanticTypeImport: /from '\.\.\/\.\.\/compiler\/types\/SemanticType'/.test(source),
  noParsedDescriptor: !/Parsed(?:[A-Z][A-Za-z0-9]*)Descriptor/.test(source),
  noFreeUnknown: !/\bunknown\b/.test(source),
  noFreeAny: !/\bany\b/.test(source),
  noFreeUndefined: !/\bundefined\b/.test(source),
};

const allPass = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 779, file: path.relative(root, file), checks, allPass }, null, 2));
process.exitCode = allPass ? 0 : 1;
