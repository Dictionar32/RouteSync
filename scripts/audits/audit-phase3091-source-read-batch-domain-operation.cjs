const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const sourcePath = path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const composition = fs.readFileSync(compositionPath, 'utf8');
const report = {
  phase: 3091,
  scope: 'focused source-read result to batch domain operation',
  resultOperationDeclared: /interface PhpSourceDocumentReadResultOperations\s*\{[\s\S]*?contributeToBatch:\s*\(accumulator:\s*PhpSourceDocumentReadBatchAccumulator\)/.test(source),
  completeResultContributesDocument: /contributeToBatch:\s*\(accumulator:\s*PhpSourceDocumentReadBatchAccumulator\):\s*PhpSourceDocumentReadBatchAccumulator\s*=>\s*accumulator\.acceptComplete\(evidence\.document\)/.test(source),
  blockedResultContributesBlockerEvidence: /contributeToBatch:\s*\(accumulator:\s*PhpSourceDocumentReadBatchAccumulator\):\s*PhpSourceDocumentReadBatchAccumulator\s*=>\s*accumulator\.acceptBlocked\(evidence\)/.test(source),
  batchFactoryDelegatesToDomainOperation: /for\s*\(const result of results\)\s*\{\s*accumulator = result\.contributeToBatch\(accumulator\);\s*\}/.test(source),
  runtimeCliConsumerPreserved: composition.includes('phpSourceDocumentReadOperationBatchFactory.fromSettlements(settledSourceReads)'),
  fullRepositoryExportMigrationComplete: false,
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
const failed = Object.entries(report).filter(([key, value]) => key.endsWith('Complete') || key.endsWith('Verified') ? value !== false : key !== 'phase' && key !== 'scope' && value !== true);
const outputPath = path.join(root, 'reports/PHASE3091_SOURCE_READ_BATCH_DOMAIN_OPERATION_AUDIT.json');
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
