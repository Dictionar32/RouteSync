const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const manifestContract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const identity = read('packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts');

const checks = {
  sourceReadBatchStillHasGenericContinuation: upstream.includes('PhpSourceDocumentReadBatchHandlers<Result>') && upstream.includes('continueWith: <Result>(handlers: PhpSourceDocumentReadBatchHandlers<Result>) => Result'),
  cliConsumesSourceReadBatchContinuation: composition.includes('identityBatch.toSourceReadBatch(phpSourceDocumentReadBatchFactory).continueWith({'),
  completeAndBlockedOutcomesRemainDistinct: upstream.includes('PhpSourceDocumentReadBatchCompleteEvidence') && upstream.includes('PhpSourceDocumentReadBatchBlockedEvidence'),
  identityBatchAlreadyUsesNamedDomainOperations: identity.includes('toSourceReadBatch: (factory: PhpSourceDocumentReadBatchFactoryInterface) => PhpSourceDocumentReadBatchJudgment') && identity.includes('preserveRejectedEvidence: () => PhpSourceDocumentIdentityBindingBatchRejectedEvidence'),
  cliManifestTerminalContractIsCliOwned: manifestContract.includes('export interface ControllerInvocationManifest') || manifestContract.includes('interface ControllerInvocationManifest'),
  noCoreImportOfCliManifestContract: !upstream.includes("from '@routesync/cli'") && !upstream.includes("from '../../cli"),
};

const report = {
  phase: 3097,
  scope: 'audit the next generic source-document read-batch continuation and its upstream-to-CLI ownership boundary',
  checks,
  migrationDecision: {
    sourceRuntimeCodeChanged: false,
    reason: 'The read-batch continuation currently returns a caller-selected generic Result, while the terminal ControllerInvocationManifest contract is CLI-owned. Replacing the generic result with a CLI manifest type in core would invert package ownership. A safe migration first needs a named shared terminal-outcome contract or a domain-specific operation boundary that preserves the core-to-CLI dependency direction.',
    requiredNextDesignStep: 'Model the source-read batch terminal outcome as an explicit shared domain contract, or establish a CLI-owned continuation adapter that consumes variant-specific core operations without adding a reverse dependency.',
  },
  preservedSemantics: [
    'Complete documents remain distinct from blocked reads.',
    'Partial documents and every blocker must remain available on blocked batches.',
    'The CLI manifest terminal contract remains owned by the CLI package.',
    'Identity-bound and identity-rejected batch evidence remains distinct.',
  ],
  notVerified: [
    'TypeScript typecheck',
    'Full test suite',
    'PHP source to CLI manifest to generator end-to-end execution',
    'Repository-wide export-interface migration',
    'Repository-wide removal of requested primitives',
  ],
};

fs.writeFileSync(path.join(root, 'reports/PHASE3097_READ_BATCH_CONTINUATION_BOUNDARY_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
const failed = Object.entries(checks).filter(([, value]) => value !== true);
if (failed.length) {
  process.stderr.write(`Phase 3097 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
