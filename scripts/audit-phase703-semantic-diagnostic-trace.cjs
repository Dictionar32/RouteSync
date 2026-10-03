const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const size = (p) => fs.statSync(path.join(root, p)).size;

const relationSequence = read('packages/core/src/semantic/kernel/relationalSequence.ts');
const relationFoundation = read('packages/core/src/semantic/kernel/relationFoundation.ts');
const modelParser = read('packages/core/src/compiler/scanner/subscanners/model/modelParser.ts');
const canonicalBuilder = read('packages/core/src/compiler/scanner/descriptors/model/entity/modelDescriptorClass.ts');
const legacyFiles = [
  'packages/core/src/compiler/scanner/descriptors/model/modelAccessorDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/modelCastDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/modelColumnDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/modelRelationDescriptor.ts',
  'packages/core/src/compiler/scanner/descriptors/model/relation/index.ts',
  'packages/core/src/compiler/scanner/descriptors/model/relation/modelRelationDescriptorClass.ts',
  'packages/core/src/compiler/scanner/descriptors/model/relation/relationFactories.ts',
  'packages/core/src/compiler/scanner/descriptors/model/relation/types.ts',
];
const legacyTests = [
  'packages/core/src/types/domain/__tests__/relation-cardinality.contract.phase-87-22.test.ts',
  'packages/core/src/types/domain/__tests__/model-upstream-single-vocabulary.phase87.52.test.ts',
];
const sourceFiles = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.isFile() && p.endsWith('.ts')) sourceFiles.push(p);
  }
};
walk(path.join(root, 'packages'));
const productionFiles = sourceFiles.filter(p => !p.includes('__tests__') && !p.includes('/tests/'));
const source = productionFiles.map(p => fs.readFileSync(p, 'utf8')).join('\n');
const legacySymbols = [
  'ScannedModelAccessorDescriptor', 'ScannedModelCastDescriptor', 'ScannedModelColumnDescriptor',
  'ScannedModelRelationDescriptor', 'createScannedAccessor', 'createScannedCast',
  'createScannedColumn', 'createScannedRelation', 'ModelAccessorExpression', 'ModelAccessorMatchArm'
];
const productionLegacyReferences = sourceFiles
  .filter(p => !p.includes('__tests__') && !p.includes('/tests/'))
  .flatMap(p => legacySymbols.filter(s => fs.readFileSync(p, 'utf8').includes(s)).map(s => `${path.relative(root,p)}:${s}`));

const forbiddenHost = {
  if: (source.match(/\bif\s*\(/g) || []).length,
  while: (source.match(/\bwhile\s*\(/g) || []).length,
  for: (source.match(/\bfor\s*\(/g) || []).length,
  switch: (source.match(/\bswitch\s*\(/g) || []).length,
  map: (source.match(/\.map\s*\(/g) || []).length,
  filter: (source.match(/\.filter\s*\(/g) || []).length,
  reduce: (source.match(/\.reduce\s*\(/g) || []).length,
  flatMap: (source.match(/\.flatMap\s*\(/g) || []).length,
  undefined: (source.match(/\bundefined\b/g) || []).length,
  null: (source.match(/\bnull\b/g) || []).length,
  '??': (source.match(/\?\?/g) || []).length,
  '===/!==': (source.match(/===|!==/g) || []).length,
  'as unknown': (source.match(/\bas\s+unknown\b/g) || []).length,
  any: (source.match(/\bany\b/g) || []).length,
  new: (source.match(/\bnew\s+/g) || []).length,
};

const result = {
  phase: 703,
  kind: 'semantic-diagnostic-relational-sequence-binding-and-legacy-descriptor-vacuum',
  dtsFrontier: {
    relationNoneBound: /type RelationNone/.test(relationSequence) && /type RelationNone/.test(relationFoundation),
    relationSomeBound: /type RelationSome/.test(relationSequence) && /type RelationSome/.test(relationFoundation),
    relationOptionFoldAvailable: /relationOptionFold/.test(relationSequence),
    sequenceADT: /type Sequence/.test(read('packages/core/src/types/upstream/collections.ts')),
  },
  descriptorCutover: {
    canonicalBuilderPresent: /export function buildModelSemanticDefinition/.test(canonicalBuilder),
    modelParserTargetsCanonicalBuilder: /buildModelSemanticDefinition/.test(modelParser),
    emptyLegacyFiles: legacyFiles.every(exists) && legacyFiles.every(p => size(p) === 0),
    legacyTestsEmptied: legacyTests.every(exists) && legacyTests.every(p => size(p) === 0),
    productionLegacyReferences,
  },
  hostInventory: forbiddenHost,
  status: productionLegacyReferences.length === 0 && legacyFiles.every(p => size(p) === 0) &&
    legacyTests.every(p => size(p) === 0) && /type RelationNone/.test(relationSequence) && /type RelationSome/.test(relationSequence)
    ? 'PASS' : 'FAIL'
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.status === 'PASS' ? 0 : 1;
