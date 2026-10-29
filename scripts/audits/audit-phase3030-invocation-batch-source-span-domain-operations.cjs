const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const authority = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticJudgmentBatchClosureAuthority.ts');
const provenance = read('packages/core/src/types/upstream/provenance.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationFoundationPaths = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  batchClosureUsesCanonicalSpanEquality: /sourceSpanOperations\.same\(left, right\)\.kind === 'same_source_span'/.test(authority),
  batchClosureUsesCanonicalSpanContainment: /sourceSpanOperations\.contains\(outer, span\)\.kind === 'source_span_contained'/.test(authority),
  batchClosureDoesNotReimplementSpanCoordinateRules: !/left\.start\.value\s*===\s*right\.start\.value/.test(authority) && !/span\.start\.value\s*>=\s*outer\.start\.value/.test(authority) && !/span\.end\.value\s*<=\s*outer\.end\.value/.test(authority),
  sourceSpanOperationsRemainInterfaceBacked: /export interface SourceSpanOperationsInterface/.test(provenance) && /export const sourceSpanOperations: SourceSpanOperationsInterface/.test(provenance),
  cliManifestEntryRemainsInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli),
  manifestCompositionRemainsInRuntimeTrace: /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  deletedRelationFoundationsRemainAbsent: relationFoundationPaths.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3030,
  title: 'PHP Invocation Semantic Batch Closure — SourceSpan Domain Operations',
  scope: 'Static contract audit for a concrete upstream PHP invocation batch-closure consumer. Confirms span equality and containment delegate to canonical SourceSpan ADT operations; does not claim repository-wide primitive elimination or full runtime correctness.',
  runtimePath: [
    'CLI manifest scan operation: packages/cli/src/manifestScanOperationInterface.ts',
    'Controller invocation manifest composition authority',
    'PHP invocation source inventory and semantic judgment batch closure',
    'phpFunctionInvocationSemanticJudgmentBatchClosureAuthority delegates span equality and containment to sourceSpanOperations',
    'Existing evidence completeness, duplicate/orphan judgments, and blocker/rejection ledger remain intact',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'Parser-boundary offsets remain NumberValue; a richer source-position domain is still needed beyond wrapping the numeric representation.',
    'evidenceIdentity still serializes file, offsets, and function-name evidence into a string key; a typed identity ADT is a separate migration and must preserve the full evidence identity.',
    'Syntax-evidence collection, violation-ledger construction, and array operations remain in the closure authority; they have not been mechanically rewritten.',
    'Other upstream consumers still contain direct coordinate reads and need individually scoped migrations based on their real source types.',
    'Repository-wide removal of string, number, undefined, null, boolean, reduce, empty arrays, nullish coalescing, ternaries, and exported function declarations is not complete and is not claimed.',
    'Full TypeScript typecheck, complete Vitest suite, and CLI-to-manifest end-to-end tests were not run in this environment.',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE3030_INVOCATION_BATCH_SOURCE_SPAN_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  console.error(`Phase 3030 audit failed: ${failed.map(([name]) => name).join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Phase 3030 audit passed: ${report.passed}/${report.total}`);
}
