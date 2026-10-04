const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const origin = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/symbols/model/originModelSymbol.ts'), 'utf8');
const table = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/symbols/model/modelSymbolTableClass.ts'), 'utf8');
const staleTest = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/symbols/model/__tests__/origin-model-relation-binding.phase-87-23.test.ts'), 'utf8');

const checks = {
  sequenceIsCanonicalInput: origin.includes('relationSequenceToArray(node.definition.semanticProperties)'),
  lookupAndOptionSeparated: origin.includes('lookupFromOption') && !origin.includes('Lookup<ModelSemanticProperty> = relationOptionFold'),
  propertyVariantsClosed: origin.includes("relationVariantFold<ModelSemanticProperty, 'column'") && origin.includes("'accessor'") && origin.includes("'relation'"),
  noBindingCast: !origin.includes('as ResolvedPropertyBinding') && !origin.includes('as unknown'),
  semanticTypeLoweringExplicit: origin.includes('typeExpressionToSemanticType'),
  tableLookupClosed: table.includes('matchLookup(primary') && table.includes('relationVariantFold'),
  noHostMapInTable: !table.includes('.map('),
  staleTestEmpty: staleTest.trim().length === 0,
};

for (const [name, value] of Object.entries(checks)) console.log(`${name}=${value}`);
console.log(`ALL_PASS=${Object.values(checks).every(Boolean)}`);
