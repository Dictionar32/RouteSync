const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const upstream = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const producerContract = read('packages/core/src/types/upstream/resourceProducerInterface.ts');
const judgment = read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts');
const bindingAuthority = read('packages/core/src/compiler/semantic/resourceModelBindingAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const producer = read('packages/core/src/compiler/scanner/operations/resourceProducer.ts');
const fieldProducer = read('packages/core/src/compiler/scanner/operations/resourceFieldProducer.ts');
const binder = read('packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts');
const sourceEvidence = read('packages/core/src/compiler/scanner/lexer/resourceSourceEvidence.ts');

check('Resource producer input/result/operation contracts are owned by upstream',
  producerContract.includes('export interface ResourceProducerInput<') &&
  producerContract.includes('export interface ResourceProducerResult') &&
  producerContract.includes('export interface ResourceProducerInterface<'));
check('Resource field production has an explicit upstream callable interface',
  producerContract.includes('export interface ResourceFieldProductionOperationInterface<') &&
  fieldProducer.includes("ResourceFieldProductionOperationInterface<PhpAstValue, OriginModelSymbol>"));
check('Producer implementation is typed by the upstream interface at its existing path',
  fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/resourceProducer.ts')) &&
  producer.includes('export const resourceProducer: ResourceProducerContract = Object.freeze({') &&
  producer.includes("kind: 'laravel_resource_producer'") &&
  producer.includes('contractVersion: 1'));
check('Redundant ResourceProducer.produce operation is removed',
  !upstream.includes('readonly produce: (input: ResourceProducerInput') &&
  !producer.includes('    produce(input): ResourceAst'));
check('Resource scanner no longer imports relation/foundation utilities',
  !/from ['"][^'"]*semantic\/(?:relations|foundation)[^'"]*['"]/.test(scanner));
check('Public Resource scanner operation is an interface-typed const without a local executor factory',
  /export const laravelResourceScanner:\s*LaravelResourceScannerInterface<ResourceScanEvidence>/.test(scanner) && !/const createScan\s*=/.test(scanner));
check('Resource scanner consumes closed binding outcomes through upstream ADT fold',
  scanner.includes('resourceModelBindingOutcomeFold.fold') &&
  judgment.includes('export interface ResourceModelBindingOutcomeFoldInterface') &&
  judgment.includes('export const resourceModelBindingOutcomeFold: ResourceModelBindingOutcomeFoldInterface'));
check('Binding authority owns batch completeness; scanner only folds the closed completeness judgment',
  judgment.includes('export type ResourceModelBindingBatchCompleteness =') &&
  judgment.includes('export const resourceModelBindingBatchCompletenessFold: ResourceModelBindingBatchCompletenessFoldInterface') &&
  bindingAuthority.includes('const completeness: ResourceModelBindingBatchCompleteness = relationGate(') &&
  scanner.includes('resourceModelBindingBatchCompletenessFold.fold<LaravelResourceScanJudgment>') &&
  !scanner.includes('if (rejectedArtifacts.length > 0)'));
check('Resource scanner projects from the supplied inventory and does not reacquire source evidence',
  scanner.includes('const sourceEvidence = input.resourceEvidence') &&
  !scanner.includes('scanResourceSourceEvidence('));
check('Pipeline acquires Resource evidence once and passes that exact inventory',
  (pipeline.match(/resourceEvidenceScanner\.scan\(sourceProject\)/g) ?? []).length === 1 &&
  pipeline.includes('resourceEvidence: resourceSourceEvidence'));
check('Binder no longer imports producer types from the subscanner implementation',
  binder.includes('types/upstream/resourceProducerInterface') &&
  !binder.includes('import("../../subscanners/resourceProducer").ResourceProducer'));
check('Producer contract is publicly exported from the upstream barrel', read('packages/core/src/types/upstream/index.ts').includes("export * from './resourceProducerInterface';"));
check('Upstream scanner and producer contracts do not import compiler lexer-owned AST types',
  !/from ['"][^'"]*compiler\/scanner\/lexer[^'"]*['"]/.test(upstream + producerContract));

const passed = checks.filter(result => result.passed).length;
for (const result of checks) {
  process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}\n`);
}
process.stdout.write(`\n${passed}/${checks.length} assertions passed.\n`);

const outstanding = [
  'resourceProducer.ts still contains semantic/relations imports and remains under subscanners.',
  'resourceSourceEvidence.ts still contains semantic/relations imports and remains under lexer.',
  'resourceBinder.ts still imports relation/foundation helpers and calls the legacy producer implementation.',
  'Resource producer contract is upstream-owned, but its implementation still resides in subscanners and retains relation imports.',
  'Full typecheck, build, Vitest, and CLI end-to-end are not verified in this environment.',
];
process.stdout.write('\nKnown outstanding work (not counted as passing assertions):\n');
for (const item of outstanding) process.stdout.write(`OPEN ${item}\n`);
if (passed !== checks.length) process.exitCode = 1;
