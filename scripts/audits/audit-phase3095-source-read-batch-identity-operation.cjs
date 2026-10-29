const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__tests__/php-source-document-identity-binding.phase2567.test.ts');
const read = file => fs.readFileSync(file, 'utf8');
const upstream = read(upstreamPath);
const composition = read(compositionPath);
const test = read(testPath);
const operationBatchSurface = upstream.slice(
  upstream.indexOf('export interface PhpSourceDocumentReadOperationBatchFulfilledEvidence'),
  upstream.indexOf('export interface PhpSourceDocumentReadBatchCompleteEvidence'),
);
const report = {
  phase: 3095,
  scope: 'PHP source-read settlement batch → identity-binding batch runtime transition',
  genericBatchHandlersRemoved: !operationBatchSurface.includes('PhpSourceDocumentReadOperationBatchHandlers'),
  genericBatchContinueWithRemoved: !/continueWith\s*:\s*<\s*Result\s*>/.test(operationBatchSurface),
  fulfilledBatchHasNamedIdentityOperation: /bindIdentityBatch\s*:/.test(operationBatchSurface),
  rejectedBatchPreservesTypedEvidence: /preserveRejectedEvidence\s*:/.test(operationBatchSurface),
  cliRuntimeUsesNamedIdentityOperation: /sourceReadBatch\.bindIdentityBatch\(/.test(composition),
  cliPreservesRejectedBatchEvidence: /sourceReadBatch\.preserveRejectedEvidence\(\)/.test(composition),
  regressionTestAdded: test.includes('binds a fulfilled source-read operation batch through its named identity operation'),
  residualControlFlowInCliComposition: /if\s*\(sourceReadBatch\.kind/.test(composition),
  downstreamIdentityBatchContinuationStillGeneric: /\.continueWith\(\s*\{\s*\n\s*onRejected: rejectedBatch => Promise\.resolve\(controllerInvocationManifestTerminalOperationsFactory\.sourceDocumentIdentityRejected/.test(composition),
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
report.passed = report.genericBatchHandlersRemoved
  && report.genericBatchContinueWithRemoved
  && report.fulfilledBatchHasNamedIdentityOperation
  && report.rejectedBatchPreservesTypedEvidence
  && report.cliRuntimeUsesNamedIdentityOperation
  && report.cliPreservesRejectedBatchEvidence
  && report.regressionTestAdded;
const reportPath = path.join(root, 'reports/PHASE3095_SOURCE_READ_BATCH_IDENTITY_OPERATION_AUDIT.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath: path.relative(root, reportPath), ...report }, null, 2));
if (!report.passed) process.exitCode = 1;
