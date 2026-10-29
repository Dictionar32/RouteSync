const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const routeCorrelation = read('packages/core/src/types/upstream/laravelControllerActionRouteCorrelationAuthority.ts');
const queryProjection = read('packages/core/src/types/upstream/semanticDataflowControllerQueryProjection.ts');
const dataflow = read('packages/core/src/types/upstream/semanticDataflow.ts');
const spanTests = read('packages/core/src/types/upstream/__tests__/sourceSpanDomainOperations.phase3026.test.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationFoundationPaths = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  routeActionPublicationCorrelationUsesCanonicalSpanJudgment: /sourceSpanOperations\.same\(left, right\)\.kind === 'same_source_span'/.test(routeCorrelation) && !/left\.start\.value === right\.start\.value/.test(routeCorrelation),
  controllerQueryProjectionUsesCanonicalSpanJudgment: /sourceSpanOperations\.same\(left, right\)\.kind === 'same_source_span'/.test(queryProjection) && !/left\.start\.value === right\.start\.value/.test(queryProjection),
  semanticDataflowIdentityEqualityDelegatesSpanSemantics: /sourceSpanOperations\.same\(left\.source, right\.source\)/.test(dataflow) && !/a\.start === b\.start/.test(dataflow),
  domainEqualityAndOverlapAreCoveredByTests: /same_source_span/.test(spanTests) && /source_span_overlapping/.test(spanTests) && /source_span_disjoint/.test(spanTests),
  deletedRelationFoundationsRemainAbsent: relationFoundationPaths.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3028,
  title: 'SourceSpan Identity Consumer Migration — Upstream Runtime Trace',
  scope: 'Static contract audit for source-span identity comparisons in Laravel route/action publication correlation and semantic dataflow identity/query projection consumers. This is not a global primitive-elimination claim.',
  runtimePath: [
    'CLI manifest scan operation: packages/cli/src/manifestScanOperationInterface.ts',
    'Controller invocation manifest composition authority',
    'Upstream PHP/Laravel source evidence and invocation semantic judgments',
    'Canonical source-span identity and semantic dataflow projections',
    'Manifest preparation and terminal judgment',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'Parser and serialized source offsets still use numeric representations; this migration centralizes source-span equality semantics but does not remove the boundary representation.',
    'Additional consumers still compare coordinates or construct SourceSpan values directly and must be migrated in scoped, type-verified batches.',
    'Repository-wide string/number/undefined/null/boolean, reduce/empty-array, nullish-coalescing, ternary, and exported-function conversions are not completed by this phase.',
    'Static audit success does not establish TypeScript compilation, full Vitest success, or CLI-to-manifest end-to-end behavior.',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE3028_SOURCE_SPAN_IDENTITY_CONSUMER_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  console.error(`Phase 3028 audit failed: ${failed.map(([name]) => name).join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Phase 3028 audit passed: ${report.passed}/${report.total}`);
}
