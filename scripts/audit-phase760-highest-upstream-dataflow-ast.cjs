const fs = require('fs');
const path = require('path');

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const assert = (name, value) => {
  console.log(`${value ? 'PASS' : 'FAIL'} ${name}`);
  if (!value) process.exitCode = 1;
};

const upstream = read('packages/core/src/types/upstream/astDataflowInterface.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const canonical = read('packages/core/src/types/upstream/semanticDataflow.ts');
const compatibility = read('packages/core/src/compiler/analysis/astDataflowAuthority.ts');
const analysis = read('packages/core/src/compiler/analysis/astAnalysisInterface.ts');
const validation = read('packages/core/src/compiler/scanner/operations/domain-model/validation/validationRuleSet.ts');
const validationShape = read('packages/core/src/types/domain/validationRules.ts');
const scalarBuilder = read('packages/core/src/compiler/scanner/operations/domain-model/validation/validationRuleEntry.ts');
const ecommerce = [
  'examples/ecommerce-shop-source/routes/api.php',
  'examples/ecommerce-shop-source/app/Http/Requests/StoreOrderRequest.php',
  'examples/ecommerce-shop-source/app/Http/Controllers/OrderController.php',
  'examples/ecommerce-shop-source/app/Models/Order.php',
  'examples/ecommerce-shop-source/app/Models/ProdukItem.php',
  'examples/ecommerce-shop-source/app/Http/Resources/OrderResource.php',
];

assert('upstreamDataflowInterfaceExists', exists('packages/core/src/types/upstream/astDataflowInterface.ts'));
assert('upstreamDataflowClosed', /AstDataflowFact/.test(upstream) && /closed: true/.test(canonical));
assert('upstreamHasReachabilityClosure', /kind: 'reaches'/.test(canonical) && /fixedPoint: 'least_fixed_point'/.test(canonical) && /reachClosure/.test(authority));
assert('analysisConsumesDataflowJudgment', /readonly dataflow: AstDataflowInterface/.test(analysis) && /AstDataflowJudgment/.test(upstream));
assert('analysisEmitsDataflowClosureFact', /kind: 'dataflow_closure'/.test(analysis));
assert('dataflowAuthorityExists', exists('packages/core/src/types/upstream/semanticDataflowAuthority.ts') && /createSemanticDataflowJudgment/.test(authority));
assert('historical AST dataflow authority is retired in place', compatibility.trim().length === 0);
assert('dataflowAuthorityNoOpenPredicateVocabulary', !/predicate\s*:\s*string/.test(authority));
assert('scalarShapeCarriesSemanticType', /kind: 'scalar'; readonly semanticType: SemanticType/.test(validationShape));
assert('validationScalarWitnessConsumed', /scalar => createScalarValidationFieldNode\(root\.name, scalar[,\)]/.test(validation));
assert('propertyScalarWitnessConsumed', /scalar => createScalarValidationFieldNode\(property\.name, scalar\.semanticType/.test(validation));
assert('locationWitnessConsumed', /name: location\.collection/.test(validation));
assert('residualShapeWitnessesConsumed', /existingRest =>/.test(validation) && /incomingRest =>/.test(validation));
assert('scalarShapeProducedWithType', /kind: 'scalar' as const, semanticType/.test(scalarBuilder));
assert('ecommerceShopWorkloadPresent', ecommerce.every(exists));
assert('highestDataflowTraceDocumented', exists('packages/core/src/semantic/kernel/PHASE760_HIGHEST_UPSTREAM_DATAFLOW_AST.md'));
