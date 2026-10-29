const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const compositionInterfacePath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const composition = fs.readFileSync(compositionPath, 'utf8');
const compositionInterface = fs.readFileSync(compositionInterfacePath, 'utf8');
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const checks = {
  discoveryUsesDomainContinuation: /return discovery\.continueWith\(\s*\{/.test(composition),
  discoveryProducerStillDispatchesOnEvidenceKind: /evidence\.kind === 'laravel_controller_source_discovery_complete'/.test(composition),
  discoveryContinuationUsesGenericResult: /continueWith:\s*<Result>\(handlers:\s*LaravelControllerSourceDiscoveryCompleteHandlers<Result>\)/.test(composition),
  existingUpstreamDiscoveryContractReused: /interface LaravelControllerSourceDiscoveryInterface/.test(upstream) && /type LaravelControllerSourceDiscoveryResult/.test(upstream),
  sourceIdentityPreservedDuringTraversal: /let accumulated = \[\.\.\.discovered\]/.test(composition) && /accumulated = \[\.\.\.nested\.sources\]/.test(composition),
  sourceReadBatchUsesPromiseAllMap: /Promise\.all\(discoveredSources\.map\(async requestedSourceFile/.test(composition),
  compositionRuntimeHasNoExportFunction: !/^\s*export\s+function\s+/m.test(composition),
  upstreamCollectionsRemainEmpty: fs.existsSync(collectionsPath) && fs.statSync(collectionsPath).size === 0,
  compositionHasSourceDiscoveryDependency: /readonly sourceDiscovery:\s*LaravelControllerSourceDiscoveryInterface/.test(compositionInterface),
};
const findings = [
  'Producer-side evidence.kind dispatch remains inside discovery result construction; this audit does not claim the decision was removed.',
  'The continuation callback is generic over its consumer result. Removing this generic safely requires a domain operation that does not make core depend on CLI composition; do not replace it with a duplicate generic helper or a fake fixed result.',
  'Promise.all(discoveredSources.map(...)) remains as batch scheduling. Its semantics should be modeled at the batch-result boundary before changing the projection.',
  'No runtime source files were modified in this audit phase; the phase records the next architectural seam rather than presenting an unverified refactor as complete.'
];
const report = { phase: 2891, title: 'Discovery Continuation Ownership Audit', checks, passed: Object.values(checks).filter(Boolean).length, total: Object.keys(checks).length, findings, typecheckBuildTestsE2e: 'not-run' };
const reportPath = path.join(root, 'packages/cli/src/parsers/php/docs/PHASE2891_DISCOVERY_CONTINUATION_OWNERSHIP_AUDIT.json');
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;
