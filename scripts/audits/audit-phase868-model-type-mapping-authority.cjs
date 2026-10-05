const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const graphBuilder = read('packages/cli/src/generators/normalizer/modelGraphBuilder.ts');
const modelNormalizer = read('packages/cli/src/generators/normalizer/entities/modelNormalizer.ts');
const coreMapper = read('packages/core/src/types/domain/databaseColumns.ts');
const checks = {
  coreMapperExists: coreMapper.includes('class DatabaseColumnTypeMapper'),
  graphBuilderNoDuplicateTypeConstruction: !/DatabaseColumnTypeMapper|DATABASE_COLUMN_KIND_REGISTRY|ModelFieldMap|ModelRelationMap|ModelAccessorMap|ModelCastCollection/.test(graphBuilder),
  modelNormalizerNoDuplicateTypeConstruction: !/DatabaseColumnTypeMapper|DATABASE_COLUMN_KIND_REGISTRY|getCastMapping/.test(modelNormalizer),
  graphBuilderNoLocalTypeHeuristic: !/lower\.includes\(['"]int['"]\)|lower\.includes\(['"]float['"]\)|lower\.includes\(['"]bool['"]\)/.test(graphBuilder),
  modelNormalizerNoLocalTypeHeuristic: !/lower\.includes\(['"]int['"]\)|lower\.includes\(['"]float['"]\)|lower\.includes\(['"]bool['"]\)/.test(modelNormalizer),
  modelNormalizerNoCastStringHeuristic: !/lowerCast|toLowerCase\(\).*includes|includes\(['"](?:int|float|double|real|bool|json|array|object|collection)['"]\)/.test(modelNormalizer),
};
checks.allChecksPassed = Object.values(checks).every(Boolean);
console.log(JSON.stringify(checks, null, 2));
process.exit(checks.allChecksPassed ? 0 : 1);
