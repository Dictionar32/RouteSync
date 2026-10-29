const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const upstream = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts'), 'utf8');
const composition = fs.readFileSync(path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'), 'utf8');
const barrel = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/index.ts'), 'utf8');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'), 'utf8');
const checks = [
  ['batch judgment is domain-specific', /PhpSourceDocumentReadBatchJudgment/.test(upstream) && /php_source_document_read_batch_complete/.test(upstream) && /php_source_document_read_batch_blocked/.test(upstream)],
  ['batch outcomes preserve complete and blocked evidence', /partialDocuments: readonly PhpSourceDocument\[\]/.test(upstream) && /blockedReads: readonly \[PhpSourceDocumentReadBlockedEvidence/.test(upstream)],
  ['batch ADT owns continuation', /interface PhpSourceDocumentReadBatchOperations\s*\{\s*readonly continueWith/.test(upstream)],
  ['factory has an explicit interface-first export', /export const phpSourceDocumentReadBatchFactory:\s*PhpSourceDocumentReadBatchFactoryInterface/.test(upstream)],
  ['producer classifies each read via its existing ADT operation', /fromResults: results =>\s*\{\s*const collected = results\.reduce/.test(upstream) && /result\.continueWith\(/.test(upstream)],
  ['composition delegates aggregation to the batch ADT', /phpSourceDocumentReadBatchFactory\.fromResults\(boundBatch\.readResults\)\.continueWith/.test(composition)],
  ['composition no longer branches on blockedReads length', !/if\s*\(blockedReads\.length\s*>\s*0\)/.test(composition)],
  ['complete branch continues through named domain operation', /onComplete: completeBatch => continueWithCompleteDocuments\(/.test(composition)],
  ['blocked branch preserves partial documents and blockers', /partialDocuments: blockedBatch\.partialDocuments/.test(composition) && /blockedBatch\.blockedReads\.map/.test(composition)],
  ['upstream barrel exports the existing frontend contract module', /export \* from '\.\/phpSourceFrontendInterface'/.test(barrel)],
  ['collections remains empty', collections.length === 0],
];
const report = {
  phase: 2877,
  title: 'Fully Typed Runtime Scanner Operations — Source Document Batch Domain Continuation',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  scope: 'Structural source audit; does not claim full typecheck, build, or end-to-end tests.',
};
const output = path.join(root, 'packages/core/src/types/upstream/PHASE2877_AUDIT.json');
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
for (const check of report.checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
console.log(`${report.passed}/${report.total} structural checks passed`);
if (report.passed !== report.total) process.exitCode = 1;
