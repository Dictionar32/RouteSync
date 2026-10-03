const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const core = path.join(root, 'packages/core/src');

const read = file => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const target = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(target) : [target];
});
const tsFiles = walk(core).filter(file => file.endsWith('.ts'));

const forbidden = /\b(if|for|while|switch)\b|\.(map|filter|reduce|flatMap)\s*\(|\bundefined\b|\?\?|\bnull\b|===|as unknown|\bany\b|\bnew\b/g;
const targets = [
  'compiler/scanner',
  'compiler/types',
  'compiler/domain',
  'types/domain',
  'types/upstream',
].map(part => path.join(core, part));

const forbiddenCount = dir => walk(dir)
  .filter(file => file.endsWith('.ts'))
  .reduce((total, file) => total + (read(file).match(forbidden) || []).length, 0);

const descriptorRefs = tsFiles
  .filter(file => /ResourceFieldDescriptor|ScannedResourceFieldDescriptor|ScannedResourceFieldParams/.test(read(file)))
  .map(file => path.relative(root, file));

const relationCardinalityFile = path.join(core, 'types/domain/eloquentTypes.ts');
const relationText = read(relationCardinalityFile);
const cardinalityClosed =
  relationText.includes("export type SingleRelationDescriptor = ModelSemanticRelation &") &&
  relationText.includes("export type CollectionRelationDescriptor = ModelSemanticRelation &");

const ecommerce = path.join(root, 'examples/ecommerce-shop-source');
const laravelEvidence = [
  path.join(ecommerce, 'app/Http/Resources/OrderResource.php'),
  path.join(ecommerce, 'app/Http/Resources/PaymentResource.php'),
  path.join(ecommerce, 'app/Http/Resources/ProdukItemResource.php'),
].every(fs.existsSync);

const legacyResourceDescriptorFiles = [
  'compiler/scanner/descriptors/resource/index.ts',
  'compiler/scanner/descriptors/resource/resourceDescriptorClass.ts',
  'compiler/scanner/descriptors/resource/resourceDescriptorTypes.ts',
  'compiler/scanner/descriptors/resource/resourceFieldDescriptor.ts',
  'compiler/scanner/descriptors/resourceDescriptors.ts',
].map(part => path.join(core, part));
const legacyResourceDescriptorFilesEmpty = legacyResourceDescriptorFiles.every(file => fs.existsSync(file) && fs.statSync(file).size === 0);

const result = {
  phase: 724,
  checks: {
    cardinalityIsClosedSemanticRelation: cardinalityClosed,
    laravelEcommerceResourceEvidence: laravelEvidence,
    legacyResourceDescriptorFilesEmpty,
    legacyResourceDescriptorProductionRefsRemain: descriptorRefs,
    forbiddenConstructCounts: Object.fromEntries(targets.map(dir => [path.relative(core, dir), forbiddenCount(dir)])),
  },
  nextFrontier: [
    'replace ResourceFieldDescriptor production consumers with upstream ResourceField plus semantic witness/bound binding',
    'cut scanner/lexer and resolver control constructs over to declarative relation programs',
    'cut analysis and semantic type lowering over to closed ADTs and fixed-point solver/rewrite engine',
    'empty only legacy files proven unreachable by exact import audit',
  ],
};
result.pass = result.checks.cardinalityIsClosedSemanticRelation && result.checks.laravelEcommerceResourceEvidence && result.checks.legacyResourceDescriptorFilesEmpty;
console.log(JSON.stringify(result, null, 2));
