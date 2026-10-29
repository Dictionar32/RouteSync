const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const identityInterface = read('packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts');
const identityAuthority = read('packages/core/src/types/upstream/phpSourceDocumentIdentityBindingBatchAuthority.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const test = read('packages/core/src/types/upstream/__tests__/php-source-document-identity-binding.phase2567.test.ts');

const checks = {
  genericBatchHandlersRemoved: !identityInterface.includes('PhpSourceDocumentIdentityBindingBatchHandlers') && !identityInterface.includes('continueWith: <Result>'),
  boundBatchHasNamedSourceReadOperation: identityInterface.includes('toSourceReadBatch: (factory: PhpSourceDocumentReadBatchFactoryInterface) => PhpSourceDocumentReadBatchJudgment'),
  rejectedBatchHasEvidencePreservationOperation: identityInterface.includes('preserveRejectedEvidence: () => PhpSourceDocumentIdentityBindingBatchRejectedEvidence'),
  authorityImplementsBoundOperation: identityAuthority.includes('toSourceReadBatch: factory => factory.fromResults('),
  authorityImplementsRejectedOperation: identityAuthority.includes('preserveRejectedEvidence: () => evidence'),
  cliUsesNamedBoundOperation: composition.includes('identityBatch.toSourceReadBatch(phpSourceDocumentReadBatchFactory)'),
  cliUsesNamedRejectedOperation: composition.includes('identityBatch.preserveRejectedEvidence()'),
  regressionTestsCoverBothOutcomes: test.includes('continues a bound identity batch into the source-read batch domain') && test.includes('preserves rejected identity evidence through its named domain operation'),
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
const report = {
  phase: 3096,
  scope: 'replace generic identity-binding batch continuation with explicit bound/rejected domain operations on the PHP scanner runtime path',
  checks,
  remainingKnownBoundaries: [
    'CLI still discriminates the rejected identity-batch outcome before entering the source-read batch path.',
    'The following source-document read batch still uses continueWith handlers.',
    'Other generic continuations and repository-wide export conversions remain outside this phase.',
    'Full typecheck, full test suite, and PHP-to-manifest/generator E2E are not verified.',
  ],
};
fs.writeFileSync(path.join(root, 'reports/PHASE3096_IDENTITY_BATCH_EXPLICIT_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
const failed = Object.entries(checks).filter(([name, value]) => name.startsWith('full') || name.endsWith('E2eVerified') ? false : value !== true);
if (failed.length) {
  process.stderr.write(`Phase 3096 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
