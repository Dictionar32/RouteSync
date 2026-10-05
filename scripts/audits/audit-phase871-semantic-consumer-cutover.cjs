const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const enumBuilder = read('packages/cli/src/generators/constants/enumConstantsBuilder.ts');
const cartResolver = read('packages/cli/src/resolvers/intent/cartModelResolver.ts');
const modelGraphTypes = read('packages/core/src/types/semantic/modelGraphTypes.ts');

const checks = {
  enumBuilderUsesSemanticSurface: enumBuilder.includes('model.definition.semantic.surface.properties'),
  enumBuilderUsesCanonicalDatabaseEnum: enumBuilder.includes("property.databaseType.kind !== 'enum'") && enumBuilder.includes('property.databaseType.values.items'),
  enumBuilderNoLegacyColumns: !enumBuilder.includes('model.columns'),
  cartUsesSemanticSurface: cartResolver.includes('definition.semantic.surface.properties'),
  cartUsesSemanticRelationKind: cartResolver.includes("property.eloquentType.kind === 'has_many'") && cartResolver.includes("relation.eloquentType.kind !== 'belongs_to'"),
  cartNoLegacyColumns: !cartResolver.includes('.columns'),
  cartNoLegacyRelations: !cartResolver.includes('.relations'),
  castCollectionStillActive: modelGraphTypes.includes('export class ModelCastCollection'),
};
checks.allChecksPassed = Object.values(checks).every(Boolean);
console.log(JSON.stringify(checks, null, 2));
process.exit(checks.allChecksPassed ? 0 : 1);
