const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const composition = fs.readFileSync(path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts'), 'utf8');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts'), 'utf8');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'), 'utf8');
const report = {
  phase: 2889,
  scope: 'discovery runtime trace and ADT ownership audit',
  checks: {
    compositionConsumesDiscoveryContinuation: /discovery\.continueWith\(/.test(composition),
    upstreamDiscoveryEvidenceContractExists: /type LaravelControllerSourceDiscoveryEvidence/.test(contract),
    upstreamDiscoveryContinuationContractExists: /interface LaravelControllerSourceDiscoveryJudgmentOperations/.test(contract) && /readonly continueWith:/.test(contract),
    producerContinuationStillBranchesOnEvidenceKind: /evidence\.kind === 'laravel_controller_source_discovery_complete'/.test(composition),
    recursiveTraversalPreservesSourceFileIdentity: /discovered: readonly SourceFile\[\]/.test(composition),
    recursiveTraversalDoesNotUnwrapSourceFile: !/nested\.sources\.map\(source => source\.value\.value\)/.test(composition),
    sourceReadBatchUsesPromiseAllMap: /Promise\.all\(discoveredSources\.map\(/.test(composition),
    collectionsFileRemainsEmpty: collections.length === 0,
  },
  validation: 'structural audit only; no full typecheck/build/test/E2E claim',
};
const failed = Object.entries(report.checks).filter(([, value]) => value !== true).map(([key]) => key);
fs.writeFileSync(path.join(root, 'PHASE2889_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
