const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'src/compiler/scanner/subscanners/ResourceScanner.ts');
const source = fs.readFileSync(file, 'utf8');

const checks = {
  resourceConsumerUsesUpstreamPresence: source.includes("type Presence") && source.includes('controllerDataflowMap: Presence<'),
  noOptionalControllerDataflow: !source.includes('controllerDataflowMap?:'),
  initialResolutionConsumesPresenceDirectly: source.includes('resolveInitialModel(resourceNameValue, modelSymbolTable, controllerDataflowMap)'),
  relationEdgesUseCanonicalFactories: source.includes('createResourceRelationFact(') && source.includes('createResourceModelResolutionFact('),
  resourceVariantsUseExplicitClosedFold: source.includes("relationVariantFold<PhpAstValue, 'resource_single'") && source.includes("relationVariantFold<Exclude<PhpAstValue, { readonly kind: 'resource_single' }>, 'resource_collection'"),
  originUsesCanonicalModelName: source.includes('value.name,') && !source.includes('value.identity.name'),
  arrayEntryUsesClosedKeyedFold: source.includes("relationVariantFold<PhpArrayEntry, 'keyed', string>(entry, 'keyed'"),
  noDeadFsImport: !source.includes('node:fs'),
  noLegacyResourceFieldExpressionImport: !source.includes('ResourceFieldExpression'),
  parsedDescriptorVocabularyAbsent: !/Parsed[A-Z][A-Za-z0-9_]*Descriptor/.test(source),
};

const allPass = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 810, file, checks, allPass }, null, 2));
process.exitCode = allPass ? 0 : 1;
