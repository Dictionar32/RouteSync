const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const graphTypes = read('packages/core/src/types/semantic/modelGraphTypes.ts');
const index = read('packages/core/src/index.ts');
const normalizer = read('packages/cli/src/generators/normalizer/entities/modelNormalizer.ts');
const semanticDefinition = read('packages/core/src/compiler/scanner/semantic/model/modelSemanticDefinition.ts');
const columnOrigin = read('packages/core/src/compiler/scanner/subscanners/model/modelColumnOrigin.ts');
const testA = read('packages/sdk/tests/pureCoreTypeContracts.spec.ts');
const testB = read('packages/sdk/tests/semanticTypeHardeningSSOT.spec.ts');

const result = {
  castCollectionRemovedFromGraphTypes: !graphTypes.includes('ModelCastCollection') && !graphTypes.includes('ModelCastEntry'),
  castCollectionRemovedFromCoreExports: !index.includes('ModelCastCollection') && !index.includes('ModelCastEntry'),
  castsCorrelateIntoColumnFacts: columnOrigin.includes('type: ModelColumnType') && columnOrigin.includes('casted'),
  semanticColumnsCarryCastSemanticType: semanticDefinition.includes('semanticTypeOfColumn') && semanticDefinition.includes('ModelSemanticColumn'),
  normalizerUsesSemanticSurface: normalizer.includes('semantic.surface.properties'),
  staleCastCollectionTestsRemoved: !testA.includes('ModelCastCollection') && !testB.includes('ModelCastCollection'),
};
result.allChecksPassed = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
if (!result.allChecksPassed) process.exit(1);
