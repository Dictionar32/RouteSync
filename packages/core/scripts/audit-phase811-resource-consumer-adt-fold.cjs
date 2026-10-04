const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'src/compiler/scanner/subscanners/ResourceScanner.ts');
const source = fs.readFileSync(file, 'utf8');

const resourceFold = source.match(/relationVariantFold<PhpAstValue, 'resource_single'[\s\S]*?\n\s*\),\n\s*\);/);
const keyFold = source.match(/function requireStringArrayKey[\s\S]*?\n}/);

const checks = {
  resourceSingleFoldPresentBranchIsNarrowed: Boolean(resourceFold && resourceFold[0].indexOf("single => [createResourceRelationFact") > resourceFold[0].indexOf("rest => relationVariantFold")),
  resourceCollectionFoldPresentBranchIsNarrowed: Boolean(resourceFold && resourceFold[0].indexOf("collection => [createResourceRelationFact") > resourceFold[0].indexOf("() => [],")),
  resourceCollectionRestIsExplicit: source.includes("relationVariantFold<Exclude<PhpAstValue, { readonly kind: 'resource_single' }>, 'resource_collection'"),
  keyedFoldPresentBranchIsNarrowed: source.includes("'keyed',\n        () => { throw Error('Expected a keyed PHP array entry") && source.includes('keyed => relationVariantFold'),
  stringKeyFoldPresentBranchIsNarrowed: source.includes("Expected a static string PHP array key at this semantic boundary") && source.includes('key => key.value'),
  canonicalModelName: source.includes('value.name,') && !source.includes('value.identity.name'),
  noParsedDescriptor: !/Parsed[A-Z][A-Za-z0-9_]*Descriptor/.test(source),
};

const allPass = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 811, file, checks, allPass }, null, 2));
process.exitCode = allPass ? 0 : 1;
