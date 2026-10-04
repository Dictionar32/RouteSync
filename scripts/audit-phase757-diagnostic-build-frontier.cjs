const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const validation = path.join(root, 'packages/core/src/compiler/scanner/descriptors/validation/validationRuleSet.ts');
const mutations = path.join(root, 'packages/core/src/compiler/scanner/descriptors/route/routeMutations.ts');
const factory = path.join(root, 'packages/core/src/compiler/scanner/descriptors/route/RouteSemanticFlowFactory.ts');
const parsedNames = [
  'packages/core/src/types/semantic/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/parsedAstTypes.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstTypes.ts',
  'packages/core/src/types/domain/semanticResolutionLegacyAdapter.ts',
];
const read = file => fs.readFileSync(file, 'utf8');
const validationCode = read(validation);
const mutationCode = read(mutations);
const factoryCode = read(factory);
const productionFiles = [];
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
  const full = path.join(directory, entry.name);
  entry.isDirectory() ? walk(full) : (entry.isFile() && full.endsWith('.ts') ? productionFiles.push(full) : undefined);
});
walk(path.join(root, 'packages/core/src'));
const parsedLeak = productionFiles.some(file => !parsedNames.includes(path.relative(root, file)) && /ParsedDescriptor|parsedDescriptor/.test(read(file)));
const checks = {
  validationNoHostControlFlow: !/\b(?:if|while|for|switch)\s*\(/.test(validationCode),
  validationNoForbiddenCollections: !/\.(?:map|filter|reduce|flatMap)\s*\(/.test(validationCode),
  validationNoUnsafeEscape: !/\bas\s+(?:unknown|any|const)\b/.test(validationCode),
  validationNoStrictEquality: !/===/.test(validationCode),
  validationCanonicalRelationIndex: validationCode.includes('RelationIndex<PropertyName, RootValidationField>') && validationCode.includes('relationIndexAdd'),
  invalidationDescriptorIsCanonicalized: mutationCode.includes('canonicalInvalidation') && mutationCode.includes('sequenceFromArray'),
  factoryUsesDescriptorBoundary: factoryCode.includes('withInvalidation: (invalidation: RouteCacheInvalidationDescriptor)'),
  parsedDescriptorProductionLeak: !parsedLeak,
  parsedDescriptorReservoirsEmpty: parsedNames.every(file => fs.statSync(path.join(root, file)).size === 0),
};
const result = { phase: 757, model: 'diagnostic-build-frontier-to-canonical-semantic-model', checks, failed: Object.entries(checks).filter(([, value]) => !value).map(([key]) => key) };
result.pass = result.failed.length === 0;
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
