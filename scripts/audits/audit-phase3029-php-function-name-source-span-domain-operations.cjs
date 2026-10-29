const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const authority = read('packages/core/src/types/upstream/phpFunctionNameResolutionAuthority.ts');
const provenance = read('packages/core/src/types/upstream/provenance.ts');
const spanTests = read('packages/core/src/types/upstream/__tests__/sourceSpanDomainOperations.phase3026.test.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationFoundationPaths = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  phpFunctionResolutionConsumesCanonicalSpanOperations: /sourceSpanOperations\.same\(left, right\)/.test(authority) && /sourceSpanOperations\.validateNonEmpty\(span\)/.test(authority) && /sourceSpanOperations\.contains\(region, span\)/.test(authority),
  phpFunctionResolutionNoLongerReimplementsSpanCoordinateComparisons: !/left\.start\.value\s*===\s*right\.start\.value/.test(authority) && !/span\.start\.value\s*>=\s*region\.start\.value/.test(authority) && !/span\.end\.value\s*<=\s*region\.end\.value/.test(authority),
  spanDomainDefinesClosedJudgmentsAndInterfaceBackedOperations: /export type SourceSpanEquality/.test(provenance) && /export type SourceSpanValidity/.test(provenance) && /export type SourceSpanContainment/.test(provenance) && /export interface SourceSpanOperationsInterface/.test(provenance) && /export const sourceSpanOperations: SourceSpanOperationsInterface/.test(provenance),
  sourceSpanDomainBehaviorHasFocusedTests: /sourceSpanOperations\.same\(/.test(spanTests) && /sourceSpanOperations\.validateNonEmpty\(/.test(spanTests) && /sourceSpanOperations\.contains\(/.test(spanTests),
  cliManifestEntryRemainsInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli) && /authority\.compose\(input\)/.test(cli),
  manifestCompositionAuthorityRemainsInRuntimePath: /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  removedRelationFoundationsRemainAbsent: relationFoundationPaths.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3029,
  title: 'PHP Function Name Resolution — SourceSpan Domain Operation Migration',
  scope: 'Static audit of a selected upstream runtime consumer. It confirms PHP function-name resolution delegates source-span equality, validity, and containment to the canonical upstream ADT; it does not claim repository-wide primitive elimination or full runtime correctness.',
  runtimePath: [
    'CLI manifest scan operation: packages/cli/src/manifestScanOperationInterface.ts',
    'Controller invocation manifest composition authority',
    'PHP source evidence and function-name resolution environment',
    'phpFunctionNameResolutionAuthority delegates source-span semantics to sourceSpanOperations',
    'Invocation semantic judgments and manifest preparation retain their existing evidence/blocker flow',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'SourceSpan coordinates still use NumberValue as parser-boundary representation; a richer source-position model must carry domain operations rather than merely wrapping a primitive.',
    'Some upstream consumers still compare source coordinates directly and need scoped migrations based on their actual types and runtime ownership.',
    'PHP parser input still necessarily decodes source offsets and lexical names at a boundary; those values must be converted into typed domain evidence immediately rather than pretending primitive values can disappear from all boundaries.',
    'Repository-wide conversion of reduce, empty arrays, nullish coalescing, ternaries, primitive result types, and all exported functions has not been completed. No global elimination claim is made.',
    'Full TypeScript typecheck, Vitest suite, and CLI-to-manifest end-to-end tests were not run in this environment.',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE3029_PHP_FUNCTION_NAME_SOURCE_SPAN_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  console.error(`Phase 3029 audit failed: ${failed.map(([name]) => name).join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Phase 3029 audit passed: ${report.passed}/${report.total}`);
}
