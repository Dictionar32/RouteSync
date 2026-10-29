const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const scanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const producerContract = read('packages/core/src/types/upstream/resourceProducerInterface.ts');
const knowledgeAuthority = read('packages/core/src/compiler/semantic/resourceModelKnowledgeDataFlowAuthority.ts');
const relationResolverPath = 'packages/core/src/compiler/scanner/operations/resource/twoPassRelationResolver.ts';
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const legacyBindingContract = read('packages/core/src/types/upstream/resourceDefinitionBindingInterface.ts');
const legacyBinder = read('packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts');

check('Canonical Resource scanner imports the upstream ResourceProducerInterface',
  scanner.includes("from '../../../types/upstream/resourceProducerInterface'"));
check('Canonical scanner binds the concrete PHP syntax types to the upstream producer contract',
  /type LaravelResourceProducerOperations = ResourceProducerInterface</.test(scanner) &&
  scanner.includes('PhpArrayEntry,') && scanner.includes('PhpStatement,') &&
  scanner.includes('PhpMethodAst,') && scanner.includes('PhpClassPropertyAst,') &&
  scanner.includes('PhpAstValue,') && scanner.includes('OriginModelSymbol'));
check('Canonical scanner routes production calls through the interface-typed operation',
  scanner.includes('const resourceProducerOperations: LaravelResourceProducerOperations = resourceProducer;') &&
  scanner.includes('resourceProducerOperations.produceResult({') &&
  !scanner.includes('resourceProducer.produceResult({'));
check('Upstream producer interface is exported from the upstream barrel',
  upstreamIndex.includes("export * from './resourceProducerInterface';"));
check('Knowledge authority implementation is typed by its upstream operation interface',
  knowledgeAuthority.includes('export const resourceModelKnowledgeDataFlowOperations: ResourceModelKnowledgeDataFlowOperationsInterface'));
check('Orphaned two-pass relation resolver is retired instead of preserving an uncalled semantic path',
  !fs.existsSync(path.join(root, relationResolverPath)));
check('Legacy ResourceDefinitionBinding contract is recognized as a separate binder path, not falsely claimed as scanner wiring',
  legacyBindingContract.includes('ResourceDefinitionBindingOperationInterface') &&
  legacyBinder.includes('ResourceDefinitionBindingOperationInterface') &&
  !scanner.includes('ResourceDefinitionBindingOperationInterface'));
check('Changed production scanner and knowledge authority do not import semantic/foundation',
  !/from ['"][^'"]*semantic\/foundation[^'"]*['"]/.test(scanner + knowledgeAuthority));

const passed = checks.filter(result => result.passed).length;
for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
process.stdout.write(`\n${passed}/${checks.length} assertions passed.\n`);

const outstanding = [
  'ResourceProducerInterface is now connected at the canonical scanner boundary, but its concrete implementation is still imported from scanner/operations/resourceProducer.ts.',
  'resourceProducer.ts, resourceFieldProducer.ts, and resourceAstExpressionMapper.ts still use semantic/relations; the uncalled twoPassRelationResolver.ts subscanner has been retired.',
  'resourceBinder.ts remains a separate legacy binder path and still uses semantic/relations; ResourceDefinitionBindingOperationInterface is not the canonical scanner production contract.',
  'resourceSourceEvidence.ts remains under frontend/php and still uses semantic/relations.',
  'No direct semantic/foundation import was found in the two changed authority/scanner files; repository-wide absence is not asserted.',
  'Full typecheck, build, Vitest, and CLI end-to-end are not verified by this structural audit.',
];
process.stdout.write('\nKnown outstanding work (not counted as passing assertions):\n');
for (const item of outstanding) process.stdout.write(`OPEN ${item}\n`);
if (passed !== checks.length) process.exitCode = 1;
