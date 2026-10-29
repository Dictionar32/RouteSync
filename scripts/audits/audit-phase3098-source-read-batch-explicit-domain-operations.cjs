const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const tests = read('packages/core/src/types/upstream/__tests__/php-source-document-identity-binding.phase2567.test.ts');

const checks = {
  genericReadBatchHandlersRemoved: !upstream.includes('PhpSourceDocumentReadBatchHandlers<Result>'),
  genericReadBatchContinuationRemoved: !upstream.includes('continueWith: <Result>(handlers: PhpSourceDocumentReadBatchHandlers<Result>) => Result'),
  completeOutcomeHasNamedDomainOperation: upstream.includes('provideDocumentsForSemanticPipeline: () => readonly PhpSourceDocument[]'),
  blockedOutcomeHasNamedEvidenceOperation: upstream.includes('preserveBlockedEvidence: () => PhpSourceDocumentReadBatchBlockedEvidence'),
  completeBatchFactoryWiresNamedOperation: upstream.includes('provideDocumentsForSemanticPipeline: (): readonly PhpSourceDocument[] => evidence.documents'),
  blockedBatchFactoryWiresNamedOperation: upstream.includes('preserveBlockedEvidence: (): PhpSourceDocumentReadBatchBlockedEvidence => evidence'),
  cliConsumesNamedBatchOperations: composition.includes('sourceReadBatch.preserveBlockedEvidence()') && composition.includes('sourceReadBatch.provideDocumentsForSemanticPipeline()'),
  cliDoesNotConsumeGenericReadBatchContinuation: !composition.includes('identityBatch.toSourceReadBatch(phpSourceDocumentReadBatchFactory).continueWith('),
  regressionTestsExerciseNamedOperations: tests.includes('batch.provideDocumentsForSemanticPipeline()') && tests.includes('batch.preserveBlockedEvidence()'),
  coreDoesNotImportCliManifest: !upstream.includes("from '@routesync/cli'") && !upstream.includes("from '../../cli"),
};

const report = {
  phase: 3098,
  scope: 'focused source-read batch ADT migration from generic continuation to variant-specific domain operations',
  checks,
  runtimeTrace: [
    'CLI scan/sync',
    'controllerInvocationManifestCompositionAuthority',
    'discoveredSourcesContinuationOperation',
    'phpSourceDocumentReadOperationBatchFactory.fromSettlements',
    'identityBatch.bindIdentityBatch',
    'identityBatch.toSourceReadBatch(phpSourceDocumentReadBatchFactory)',
    'complete/blocked source-read batch',
    'semantic pipeline or CLI blocked-manifest terminal',
    'manifest builder',
    'generator',
  ],
  preservedSemantics: [
    'Complete batches preserve ordered documents.',
    'Blocked batches preserve partial documents and all blockers.',
    'Identity-rejected batches remain distinct from read-blocked batches.',
    'Core does not depend on the CLI-owned manifest contract.',
    'Deleted relation foundation modules remain deleted.',
  ],
  remaining: [
    'CLI composition still discriminates complete versus blocked outcome.',
    'Other generic continuations remain elsewhere in the repository.',
    'Repository-wide export-interface conversion is incomplete.',
    'Repository-wide requested primitive removal is incomplete.',
  ],
  notVerified: [
    'TypeScript typecheck',
    'Full test suite',
    'PHP source to CLI manifest to generator end-to-end execution',
  ],
};

fs.writeFileSync(path.join(root, 'reports/PHASE3098_SOURCE_READ_BATCH_EXPLICIT_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
const failed = Object.entries(checks).filter(([, value]) => value !== true);
if (failed.length) {
  process.stderr.write(`Phase 3098 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
