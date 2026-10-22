const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const implementation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const barrel = read('packages/core/src/index.ts');
const cliFactory = read('packages/cli/src/upstreamCompositionFactory.ts');
const cliTypes = read('packages/cli/src/upstreamCompositionInterface.ts');
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });
const operations = [
  'canonicalRouteIdentity', 'canonicalResourceIdentity', 'canonicalRequestIdentity',
  'canonicalRouteOccurrenceKey', 'canonicalResourceOccurrenceKey', 'canonicalRequestOccurrenceKey',
  'inventoryRequestTypeDerivationSourceEvidence', 'requestTypeDerivationSourceEvidenceKeys',
];
check('upstream-contract-owns-identity-and-inventory-operation-shapes',
  /interface RequestTypeDerivationSourceEvidenceInventoryInterface/.test(contract) &&
  operations.slice(0, 6).every(name => contract.includes(`readonly ${name}:`)) &&
  contract.includes('readonly inventory:') && contract.includes('readonly evidenceKeys:'),
  'the upstream interface declares the six canonical identity/occurrence operations plus inventory and evidence-key projection');
check('each-operation-is-typed-by-the-existing-upstream-interface',
  operations.slice(0, 6).every(name => new RegExp(`export const ${name}: RequestTypeDerivationSourceEvidenceInventoryInterface\\['${name}'\\]`).test(implementation)) &&
  /export const inventoryRequestTypeDerivationSourceEvidence:\s*RequestTypeDerivationSourceEvidenceInventoryInterface\['inventory'\]/.test(implementation) &&
  /export const requestTypeDerivationSourceEvidenceKeys:\s*RequestTypeDerivationSourceEvidenceInventoryInterface\['evidenceKeys'\]/.test(implementation),
  'implementation values satisfy the existing operation members rather than defining duplicate interfaces');
check('public-core-barrel-exports-the-named-operation-algebra',
  operations.every(name => new RegExp(`\\b${name}\\b`).test(barrel)) &&
  barrel.includes("from './compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory'"),
  'consumers can import named operations from the package boundary without reaching into implementation paths');
check('public-core-barrel-exports-law-inventory-and-closed-coverage-types',
  barrel.includes('REQUEST_TYPE_DERIVATION_LAW_IDS') &&
  barrel.includes('REQUEST_TYPE_DERIVATION_LAW_OBLIGATIONS') &&
  ['RequestTypeDerivationLawId', 'RequestTypeDerivationLawObligation', 'RequestTypeDerivationLawWitnessKind', 'RequestTypeDerivationRequiredLawCoverage', 'RequestTypeDerivationVerifiedLawCoverage', 'RequestTypeDerivationPolicy'].every(name => barrel.includes(name)),
  'the law inventory and mapped coverage contracts are reachable with the operation API');
check('manifest-composition-still-requires-a-supplied-semantic-pipeline',
  cliFactory.includes('assembleRequestTypeDerivationProductionPipeline') &&
  cliTypes.includes('manifestComposition') && cliTypes.includes('requestTypeDerivationPipeline'),
  'public inventory exports do not manufacture or bypass the CLI manifest/semantic composition boundary');
check('implementation-remains-outside-upstream-contract-directory',
  !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts')) &&
  fs.existsSync(path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts')),
  'executable identity operations remain in compiler semantic implementation ownership');
for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}: ${result.detail}\n`);
const failed = checks.filter(result => !result.passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} upstream export-boundary assertions passed.\n`);
if (failed.length) process.exitCode = 1;
