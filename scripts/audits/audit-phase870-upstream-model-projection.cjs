const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const modelNormalizer = read('packages/cli/src/generators/normalizer/entities/modelNormalizer.ts');
const modelGraphBuilder = read('packages/cli/src/generators/normalizer/modelGraphBuilder.ts');
const modelGenerator = read('packages/cli/src/generators/ModelGenerator.ts');
const resolver = read('packages/cli/src/generators/canonical/type-mapping/resolvers.ts');
const mapper = read('packages/core/src/types/domain/eloquentTypes.ts');
const checks = {
  upstreamSemanticPropertyIsConsumedByNormalizer: modelNormalizer.includes('semantic.surface.properties'),
  normalizerDoesNotReadLegacyModelBags: !/m\.(columns|casts|relations|accessors)\b/.test(modelNormalizer),
  upstreamSemanticDefinitionIsConsumedByGraph: modelGraphBuilder.includes('model.definition.semantic'),
  graphDoesNotReconstructModelFields: !/ModelFieldMap|ModelRelationMap|ModelAccessorMap|ModelCastCollection|DatabaseColumnTypeMapper|DATABASE_COLUMN_KIND_REGISTRY/.test(modelGraphBuilder),
  modelGeneratorAlreadyUsesUpstreamSemanticSurface: modelGenerator.includes('semantic.surface.properties'),
  castResolverUsesCanonicalMapper: resolver.includes('EloquentCastMapper.resolve(castType)'),
  castMapCompatibilityDelegatesToResolve: mapper.includes('public static map(rawTargetType') && mapper.includes('return this.resolve(rawTargetType);'),
  noLocalCastHeuristic: !/includes\(['"](?:int|float|double|real|bool|json|array|object|collection)['"]\)/.test(modelNormalizer),
};
checks.allChecksPassed = Object.values(checks).every(Boolean);
console.log(JSON.stringify(checks, null, 2));
process.exit(checks.allChecksPassed ? 0 : 1);
