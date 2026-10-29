const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/types/upstream/laravelAttributeScannerInterface.ts');
const producerContract = read('packages/core/src/compiler/scanner/attributeProducerInterface.ts');
const producerImpl = read('packages/core/src/compiler/scanner/operations/attributeProducer.ts');
const scannerImpl = read('packages/core/src/compiler/scanner/operations/attributeAstCanonical.ts');
const pipelineContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const pipelineImpl = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const trace = read('reports/phase2298/TRACE.md');
const checks = [
  ['existing upstream Laravel attribute scanner is evolved in place to v15', /interface LaravelAttributeScannerInterface\s*\{[^}]*contractVersion: 15/s.test(scanner) && !/LaravelAttributeScannerInterfaceV2|LegacyLaravelAttributeScannerInterface/.test(scanner)],
  ['complete receipt has one file-coverage sequence', /interface LaravelAttributeScanDiscoveryReceipt\s*\{[\s\S]*readonly files: LaravelAttributeScannedFileSequence;[\s\S]*readonly enumeration: LaravelAttributeDirectoryEnumerationEvidence/s.test(scanner)],
  ['complete receipt no longer contains parallel enumerated/scanned sequences', !/interface LaravelAttributeScanDiscoveryReceipt\s*\{[^}]*enumeratedSourceFiles|interface LaravelAttributeScanDiscoveryReceipt\s*\{[^}]*scannedFiles/s.test(scanner)],
  ['each coverage node binds the path to its evidence', /type LaravelAttributeScannedFileSequence\s*=\s*[\s\S]*sourceFile: SourceFile;[\s\S]*evidence: LaravelAttributeScannedFileEvidence;/.test(scanner)],
  ['per-file evidence does not duplicate the source path', /interface LaravelAttributeScannedFileEvidence\s*\{[^}]*attribute: AttributeAst;[^}]*contextuality: LaravelAttributeContextualityJudgment/s.test(scanner) && !/interface LaravelAttributeScannedFileEvidence\s*\{[^}]*sourceFile:/s.test(scanner)],
  ['blocked partial discovery retains its own discovered-file sequence', /partialDiscovery:\s*Readonly<\{\s*readonly scope: LaravelAttributeScanScope;\s*readonly discoveredSourceFiles: LaravelAttributeSourceFileSequence;/s.test(scanner)],
  ['blocked outcome remains a recursive non-empty failure ADT', /export type LaravelAttributeScanFailureSequence\s*=/.test(scanner) && /blockers: LaravelAttributeScanFailureSequence/.test(scanner)],
  ['producer contract still explicitly models complete or blocked outcomes', /export type AttributeProducerJudgment\s*=/.test(producerContract) && /attribute_producer_complete/.test(producerContract) && /attribute_producer_blocked/.test(producerContract)],
  ['existing upstream pipeline contract remains single and unchanged', /interface LaravelSourceAstPipelineInterface\s*\{[^}]*contractVersion: 9/s.test(pipelineContract) && !/LaravelSourceAstPipelineInterfaceV2/.test(pipelineContract)],
  ['current subscanner import is recorded as migration debt rather than target ownership', /from '\.\.\/operations\/attributeAstCanonical'/.test(pipelineImpl) && /migration debt, not the desired ownership boundary/.test(trace)],
  ['producer and pipeline incompatibilities are explicitly recorded', /return createDomainAstJudgment/.test(producerImpl) && /attributeScan\.attributes/.test(pipelineImpl) && /still reads `attributeScan\.attributes`/.test(trace)],
  ['upstream scanner interface imports neither forbidden semantic module', !/semantic\/(?:foundation|relations)/.test(scanner)],
  ['no typecheck/build claim is made', /TypeScript typecheck\/build: not run/.test(trace) && /`npm run build`: not run/.test(trace)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
