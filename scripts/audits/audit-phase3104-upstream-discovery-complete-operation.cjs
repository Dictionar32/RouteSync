const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__tests__/laravel-controller-source-discovery-complete-operation.phase3104.test.ts');
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const composition = fs.readFileSync(compositionPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const relationRoot = path.join(root, 'packages/core/src/semantic/relations');
const report = {
  phase: 3104,
  scope: 'move complete-versus-blocked discovery continuation ownership into the upstream discovery ADT and use the fixed domain operation in runtime traversal',
  upstreamDiscoveryDeclaresFixedCompleteOperation: /readonly continueCompleteDiscovery:\s*\(\s*continuation:/.test(upstream),
  completeVariantDelegatesToItsEvidence: /continueCompleteDiscovery: continuation => continuation\(evidence\)/.test(upstream),
  blockedVariantPreservesItsOwnJudgment: /continueCompleteDiscovery: \(\) => Promise\.resolve\(judgment\)/.test(upstream),
  runtimeTraversalUsesUpstreamOperation: /evidence\.continueCompleteDiscovery\(/.test(composition) && /nextJudgment\.continueCompleteDiscovery\(/.test(composition),
  runtimeCursorNoLongerExposesGenericContinuation: !/ControllerDirectoryEntryCursorHandlers<Result>|continueWith: <Result>\(handlers: ControllerDirectoryEntryCursorHandlers/.test(composition) && /continueDirectoryTraversal/.test(composition),
  regressionCoverageForCompleteAndBlockedVariants: /continues a complete discovery through its named domain operation/.test(test) && /preserves the original blocked judgment without invoking complete continuation/.test(test),
  genericContinuationRetainedOnlyAtDistinctOuterCompositionBoundary: /return discovery\.continueWith\(/.test(composition),
  noDeletedRelationFoundationRestored: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationRoot, name))),
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
const unverified = new Set(['fullTypecheckVerified', 'fullTestSuiteVerified', 'phpToCliManifestGeneratorE2eVerified']);
const failed = Object.entries(report).filter(([key, value]) => typeof value === 'boolean' && !value && !unverified.has(key)).map(([key]) => key);
const output = path.join(root, 'reports/PHASE3104_UPSTREAM_DISCOVERY_COMPLETE_OPERATION_AUDIT.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
