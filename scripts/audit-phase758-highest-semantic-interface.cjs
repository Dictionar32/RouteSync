const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const validation = read('packages/core/src/compiler/scanner/descriptors/validation/validationRuleSet.ts');
const stage = read('packages/core/src/types/upstream/astSemanticStageInterface.ts');
const stageAlgebra = read('packages/core/src/types/upstream/astSemanticStageInterfaceAlgebra.ts');
const parsed = [
  'packages/core/src/types/semantic/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/parsedAstTypes.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstAlgebra.ts',
  'packages/core/src/types/semantic/__archive__/parsedAstTypes.ts',
  'packages/core/src/types/domain/semanticResolutionLegacyAdapter.ts',
];
const empty = parsed.every(file => fs.statSync(path.join(root, file)).size === 0);
const productionFiles = [];
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
  const full = path.join(directory, entry.name);
  if (entry.isDirectory()) walk(full);
  else if (entry.isFile() && full.endsWith('.ts') && !full.endsWith('.test.ts')) productionFiles.push(full);
});
walk(path.join(root, 'packages/core/src'));
const parsedLeak = productionFiles.some(file => !parsed.includes(path.relative(root, file)) && /ParsedDescriptor|parsedDescriptor/.test(fs.readFileSync(file, 'utf8')));

const checks = {
  validationRequirementResultClosed: validation.includes("relationVariantFold<ValidationRuleNode, 'required_unless', RequestFieldRequirement>"),
  validationTreeResultClosed: validation.includes("relationVariantFold<SemanticType, 'mutable_collection', ValidationFieldNode>") && validation.includes("relationVariantFold<ValidationFieldShape, 'collection', ValidationFieldNode>"),
  validationNoUnsafeEscape: !/\bas\s+(?:unknown|any|const)\b/.test(validation),
  validationNoHostControlFlow: !/\b(?:if|while|for|switch)\s*\(/.test(validation),
  validationNoHostCollectionOps: !/\.(?:map|filter|reduce|flatMap)\s*\(/.test(validation),
  stageFactsAreStageClosed: stage.includes('export const astSemanticStageFacts') && stage.includes('AstSemanticStageFact'),
  stageInterfaceUsesClosedStageFacts: stageAlgebra.includes('astSemanticStageFacts(judgment.stage, judgment.facts)'),
  parsedDescriptorReservoirsEmpty: empty,
  parsedDescriptorProductionLeak: !parsedLeak,
};
const result = { phase: 758, model: 'highest-cross-stage-ast-semantic-interface-and-diagnostic-frontier', checks, failed: Object.entries(checks).filter(([, value]) => !value).map(([key]) => key) };
result.pass = result.failed.length === 0;
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
