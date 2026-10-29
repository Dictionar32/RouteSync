const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts');
const authorityPath = path.join(root, 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingAuthority.ts');
const batchAuthorityPath = path.join(root, 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingBatchAuthority.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__tests__/php-source-document-identity-binding.phase2567.test.ts');
const read = file => fs.readFileSync(file, 'utf8');
const interfaceSource = read(interfacePath);
const authoritySource = read(authorityPath);
const batchAuthoritySource = read(batchAuthorityPath);
const testSource = read(testPath);

const report = {
  phase: 3094,
  scope: 'individual source identity judgment → identity batch accumulator operation',
  genericIndividualJudgmentHandlersRemoved: !interfaceSource.includes('PhpSourceDocumentIdentityBindingHandlers'),
  genericIndividualJudgmentContinuationRemoved: !interfaceSource.slice(interfaceSource.indexOf('export interface PhpSourceDocumentIdentityBindingJudgmentOperations'), interfaceSource.indexOf('export type PhpSourceDocumentIdentityBoundEvidence')).includes('continueWith'),
  namedContributeToBatchOperationDeclared: /interface PhpSourceDocumentIdentityBindingJudgmentOperations[\s\S]*?contributeToBatch/.test(interfaceSource),
  boundJudgmentContributesToBatch: /contributeToBatch:[\s\S]*?accumulator\.includeBound\(evidence\)/.test(authoritySource),
  rejectedJudgmentContributesToBatch: /contributeToBatch:[\s\S]*?accumulator\.includeRejected\(evidence\)/.test(authoritySource),
  batchFactoryConsumesNamedOperation: /judgment\.contributeToBatch\(accumulator\)/.test(batchAuthoritySource),
  regressionTestAdded: testSource.includes('contributes an identity judgment through its typed batch operation'),
  aggregateBatchGenericContinuationRemains: /continueWith\s*:\s*<\s*Result\s*>/.test(batchAuthoritySource),
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
report.passed = report.genericIndividualJudgmentHandlersRemoved
  && report.genericIndividualJudgmentContinuationRemoved
  && report.namedContributeToBatchOperationDeclared
  && report.boundJudgmentContributesToBatch
  && report.rejectedJudgmentContributesToBatch
  && report.batchFactoryConsumesNamedOperation
  && report.regressionTestAdded;
const reportPath = path.join(root, 'reports/PHASE3094_IDENTITY_JUDGMENT_BATCH_DOMAIN_OPERATION_AUDIT.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ reportPath: path.relative(root, reportPath), ...report }, null, 2));
if (!report.passed) process.exitCode = 1;
