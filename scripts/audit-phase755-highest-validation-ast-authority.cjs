const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const validationRuleSet = path.join(root, 'packages/core/src/compiler/scanner/descriptors/validation/validationRuleSet.ts');
const validationRules = path.join(root, 'packages/core/src/types/domain/validationRules.ts');
const requestProducer = path.join(root, 'packages/core/src/compiler/scanner/subscanners/requestProducer.ts');
const ruleCollector = path.join(root, 'packages/core/src/compiler/scanner/subscanners/form-request/ruleCollector.ts');
const legacyAssembler = path.join(root, 'packages/core/src/compiler/scanner/subscanners/form-request/validationFieldAssembler.ts');
const routeFactory = path.join(root, 'packages/core/src/compiler/scanner/descriptors/route/RouteSemanticFlowFactory.ts');

const read = file => fs.readFileSync(file, 'utf8');
const stripComments = source => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
const code = file => stripComments(read(file));

const validationCode = code(validationRuleSet);
const routeCode = code(routeFactory);
const requestCode = code(requestProducer);
const collectorCode = code(ruleCollector);

const productionTs = [];
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith('.ts')) productionTs.push(full);
  }
};
walk(path.join(root, 'packages/core/src'));
const legacyReferences = productionTs
  .filter(file => file !== legacyAssembler)
  .filter(file => /validationFieldAssembler|CanonicalValidationRuleSet|assembleCanonicalValidationFields/.test(read(file)));

const checks = {
  validationEntryCarriesCanonicalSource: read(validationRules).includes('readonly source: SourceSpan;'),
  validationUsesVariantAuthority: validationCode.includes('relationVariantFold'),
  validationUsesRelationIndex: validationCode.includes('relationIndexLookup') && validationCode.includes('relationIndexAdd'),
  validationNoHostControlFlow: !/\b(?:if|while|for|switch)\s*\(/.test(validationCode),
  validationNoForbiddenCollections: !/\.(?:map|filter|reduce|flatMap)\s*\(/.test(validationCode),
  validationNoUnsafeEscape: !/\bas\s+(?:unknown|any|const)\b/.test(validationCode),
  validationNoStrictEquality: !/===/.test(validationCode),
  requestProducerUsesCanonicalValidationAuthority: requestCode.includes('RouteSemanticFlowValidationRuleSet.create'),
  ruleCollectorUsesCanonicalValidationAuthority: collectorCode.includes('RouteSemanticFlowValidationRuleSet.create'),
  legacyValidationAssemblerEmpty: fs.statSync(legacyAssembler).size === 0,
  legacyValidationAssemblerHasNoProductionReferences: legacyReferences.length === 0,
  routeFactoryUsesRelationOptionRefinement: routeCode.includes('relationOptionFold') && routeCode.includes('relationRefine'),
  routeFactoryNoImplicitInvalidationParameter: !/withInvalidation:\s*invalidation\s*=>/.test(routeCode),
};

const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
const result = { phase: 755, model: 'highest-validation-ast-authority', checks, failed, pass: failed.length === 0 };
console.log(JSON.stringify(result, null, 2));
process.exit(result.pass ? 0 : 1);
