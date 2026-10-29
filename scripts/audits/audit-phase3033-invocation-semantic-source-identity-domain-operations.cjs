const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const knowledge = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const authority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const focusedTest = read('packages/core/src/types/upstream/__tests__/invocation-semantic-identity-domain-operations.phase3033.test.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationFoundationPaths = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  semanticSourceHasClosedEqualityJudgment: /export type SemanticSourceEquality =[\s\S]*?same_semantic_source[\s\S]*?different_semantic_source/.test(knowledge),
  semanticSourceOperationsAreInterfaceBacked: /export interface SemanticSourceOperationsInterface[\s\S]*?readonly same:/.test(knowledge) && /export const semanticSource: SemanticSourceOperationsInterface = Object\.freeze\(/.test(knowledge),
  sourceEqualityPreservesPathSpanAndProvider: /left\.filePath\.value === right\.filePath\.value[\s\S]*?left\.span\.start\.value === right\.span\.start\.value[\s\S]*?left\.span\.end\.value === right\.span\.end\.value[\s\S]*?left\.evidence\.code === right\.evidence\.code/.test(knowledge),
  invocationIdentityOperationsAreInterfaceBacked: /export interface InvocationSemanticIdentityOperationsInterface/.test(authority) && /export const invocationSemanticIdentityOperations: InvocationSemanticIdentityOperationsInterface = Object\.freeze\(/.test(authority),
  invocationShapeRetainsReceiverOperationOrderedArgumentsAndSource: /sameShape:[\s\S]*?switch \(left\.receiver\.kind\)[\s\S]*?left\.operation\.name\.value[\s\S]*?left\.arguments\.length[\s\S]*?sameOrderedArguments[\s\S]*?semanticSource\.same\(left\.source, right\.source\)/.test(authority),
  serializedSourceAndInvocationShapeKeysRemoved: !/const sourceKey\s*=/.test(authority) && !/const invocationShapeKey\s*=/.test(authority) && !/JSON\.stringify/.test(authority),
  sourceProvenanceChecksUseDomainEquality: /sameSource\(source, judgment\.invocation\.source\)/.test(authority) && /sameSource\(source, flow\.callable\.source\)/.test(authority),
  focusedBehavioralTestsCoverProviderAndShapeIdentity: /different_semantic_source/.test(focusedTest) && /same_invocation_semantic_shape/.test(focusedTest) && /different_invocation_semantic_shape/.test(focusedTest),
  cliManifestEntryRemainsInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli),
  manifestCompositionRemainsInRuntimeTrace: /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  deletedRelationFoundationsRemainAbsent: relationFoundationPaths.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3033,
  title: 'Invocation Semantic Source Identity — Interface-Backed Domain Operations',
  scope: 'Static contract audit for replacing serialized SemanticSource and invocation-shape keys with explicit upstream identity judgments. A focused Vitest file was added; execution depends on project dependencies being installed.',
  runtimePath: [
    'CLI manifest scan operation: packages/cli/src/manifestScanOperationInterface.ts',
    'Controller invocation manifest composition authority',
    'Invocation semantic judgment authority validates source provenance and invocation shape',
    'semanticSource.same compares source path, source offsets, and evidence provider as a typed judgment',
    'invocationSemanticIdentityOperations.sameShape compares invocation identity, receiver disposition, operation, ordered arguments, and source provenance',
    'Validated judgments retain existing proof traces, unresolved obligations, and rejection behavior',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'KnowledgeId comparison still uses the existing derived knowledgeIdKey representation; this phase does not replace that separate identity contract.',
    'Parser-facing source paths and offsets remain primitive boundary inputs.',
    'The focused Vitest test was added but cannot be claimed as executed unless dependencies are available.',
    'Full TypeScript typecheck, full Vitest, and CLI-to-manifest end-to-end execution remain unverified.',
    'This is a scoped migration; repository-wide primitive/control-flow elimination is not claimed.',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE3033_INVOCATION_SEMANTIC_SOURCE_IDENTITY_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  console.error(`Phase 3033 audit failed: ${failed.map(([name]) => name).join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Phase 3033 audit passed: ${report.passed}/${report.total}`);
}
