const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const requireIncludes = (source, fragment, label) => {
  if (!source.includes(fragment)) throw new Error(`Missing ${label}: ${fragment}`);
};

const contracts = read('packages/core/src/types/upstream/highLevelContracts.ts');
const model = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const test = read('packages/core/src/types/upstream/__tests__/laravel-complete-source-contracts.phase1691.test.ts');

for (const category of ['schemas', 'migrations', 'dtos', 'middlewares', 'attributes', 'channels']) {
  requireIncludes(contracts, `readonly ${category}:`, `public Laravel contract category ${category}`);
  requireIncludes(model, category === 'channels' ? 'channels: collectContracts(catalog.channels, node => node.definition)' : `${category}: catalog.${category}`, `catalog-to-contract projection for ${category}`);
}
for (const category of ['schemas', 'migrations', 'dtos', 'middlewares', 'attributes']) {
  requireIncludes(model, `${category}: sequenceFromArray(sequenceProject(completeItems(source.${category}.items)`, `source AST projection for ${category}`);
}
for (const category of ['migrations', 'schemas', 'dtos', 'middlewares', 'attributes']) {
  requireIncludes(test, `contracts.${category}`, `fixture regression assertion for ${category}`);
}

console.log('Phase 1691 Laravel source contract preservation audit passed.');
