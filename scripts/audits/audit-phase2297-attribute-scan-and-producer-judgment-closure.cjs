const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const producerContract = read('packages/core/src/compiler/scanner/attributeProducerInterface.ts');
const producerImpl = read('packages/core/src/compiler/scanner/subscanners/attributeProducer.ts');
const scannerImpl = read('packages/core/src/compiler/scanner/subscanners/attributeAstCanonical.ts');
const pipelineContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const pipelineImpl = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const trace = read('reports/phase2297/TRACE.md');
const checks = [
  ['existing upstream scanner interface evolves in place to v15', /interface LaravelAttributeScannerInterface\s*\{[^}]*contractVersion: 15/s.test(scanner) && !/LaravelAttributeScannerInterfaceV2|LegacyLaravelAttributeScannerInterface/.test(scanner)],
  ['directory enumeration evidence binds root, directory, scope, and deterministic ordering', /interface LaravelAttributeDirectoryEnumerationEvidence\s*\{[^}]*sourceRoot: SourceFile;[^}]*directory: SourceFile;[^}]*scope: LaravelAttributeScanScope;[^}]*order: 'deterministic-relative-path-order'/s.test(scanner)],
  ['complete receipt binds each file path to its evidence in one sequence', /interface LaravelAttributeScanDiscoveryReceipt\s*\{[\s\S]*files: LaravelAttributeScannedFileSequence;[\s\S]*enumeration: LaravelAttributeDirectoryEnumerationEvidence/s.test(scanner)],
  ['blocked scanner judgment uses recursive failure ADT', /export type LaravelAttributeScanFailureSequence\s*=/.test(scanner) && /blockers: LaravelAttributeScanFailureSequence/.test(scanner)],
  ['producer contract has a closed complete-or-blocked judgment', /export type AttributeProducerJudgment\s*=/.test(producerContract) && /attribute_producer_complete/.test(producerContract) && /attribute_producer_blocked/.test(producerContract)],
  ['missing constructor is a typed producer blocker', /attribute_producer_constructor_missing/.test(producerContract) && /readonly blocker: AttributeProducerBlocker/.test(producerContract)],
  ['existing producer interface evolves in place without duplicate version name', /interface AttributeProducerInterface\s*\{[^}]*contractVersion: 2/s.test(producerContract) && !/AttributeProducerInterfaceV2|LegacyAttributeProducerInterface/.test(producerContract)],
  ['existing upstream pipeline contract remains the single contract', /interface LaravelSourceAstPipelineInterface\s*\{[^}]*contractVersion: 9/s.test(pipelineContract) && !/LaravelSourceAstPipelineInterfaceV2/.test(pipelineContract)],
  ['producer implementation mismatch is explicitly traceable, not hidden', /return createDomainAstJudgment/.test(producerImpl) && /attributeProducer\.produce/.test(scannerImpl) && /still returns `AttributeAst` and throws on missing constructor/.test(trace)],
  ['pipeline v14 migration debt is recorded', /attributeScan\.attributes/.test(pipelineImpl) && /must be migrated to consume v14/.test(trace)],
  ['upstream scanner contract imports neither forbidden semantic module', !/semantic\/(?:foundation|relations)/.test(scanner)],
  ['phase records interface-first boundary and no build claim', /No typecheck\/build is claimed/.test(trace)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
