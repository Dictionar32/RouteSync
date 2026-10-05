const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const sdkTests = [
  'packages/sdk/tests/middlewareProducer.spec.ts',
  'packages/sdk/tests/dtoAstProducer.spec.ts',
  'packages/sdk/tests/attributeProducer.spec.ts',
];
const coreTests = [
  'packages/core/src/compiler/analysis/__tests__/ecommerceShopHighestAstDataflowPhase760.spec.ts',
  'packages/core/src/types/upstream/__tests__/modelEloquentSurfaceFact.test.ts',
];
const forbiddenFixtureRefs = [...sdkTests, ...coreTests].some((file) => /examples\/(?:e|eco)commerce-shop-source/.test(read(file)));
const fixtureFiles = [
  'packages/sdk/tests/fixtures/ecommerce-shop-source/app/Http/Middleware/AdminMiddleware.php',
  'packages/sdk/tests/fixtures/ecommerce-shop-source/app/Http/DTOs/RegisterResponse.php',
  'packages/sdk/tests/fixtures/ecommerce-shop-source/app/Attributes/Response.php',
];
const authority = read('packages/core/src/compiler/analysis/astDataflowAuthority.ts');
const derivationClosed = authority.includes('derivations: derivationsFor(facts, closure)');
const derivationRules = [
  'semantic-dataflow-canonical-fact',
  'semantic-dataflow-reach-seed',
  'semantic-dataflow-reach-transitive',
].every((rule) => authority.includes(rule));
const oldExamplesAbsent = !exists('examples/ecommerce-shop-source') && !exists('examples/ecomerce-shop-source');
const result = {
  oldExamplesAbsent,
  sdkTestsNoDanglingExampleReference: !forbiddenFixtureRefs,
  testOwnedFixtureComplete: fixtureFiles.every(exists),
  dataflowDerivationAuthorityClosed: derivationClosed,
  dataflowDerivationRulesPresent: derivationRules,
  clean: oldExamplesAbsent && !forbiddenFixtureRefs && fixtureFiles.every(exists) && derivationClosed && derivationRules,
};
console.log(JSON.stringify(result, null, 2));
if (!result.clean) process.exit(1);
