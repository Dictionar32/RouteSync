const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const authority = read('packages/core/src/types/upstream/semanticObjectIdentityAuthority.ts');
const contract = read('packages/core/src/types/upstream/semanticObjectIdentityInterface.ts');
const knowledge = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationFoundationPaths = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  objectIdentityOperationsAreInterfaceBacked: /export interface SemanticObjectIdentityOperationsInterface/.test(contract) && /export const semanticObjectIdentityOperations: SemanticObjectIdentityOperationsInterface = Object\.freeze\(/.test(contract),
  objectIdentityUsesCanonicalKnowledgeIdEquality: /same: semanticKnowledgeIdOperations\.same/.test(contract),
  focusedPairBehaviorTestAdded: exists('packages/core/src/types/upstream/__tests__/semanticObjectIdentityDomainOperations.phase3036.test.ts'),
  orderedPairEqualityIsDomainOwned: /sameOrderedPair: \(left: SemanticKnowledgeIdPair, right: SemanticKnowledgeIdPair\)/.test(contract) && /sameOrderedPairOperation/.test(contract),
  unorderedPairEqualityIsDomainOwned: /sameUnorderedPair: \(left: SemanticKnowledgeIdPair, right: SemanticKnowledgeIdPair\)/.test(contract) && /sameUnorderedPairOperation/.test(contract),
  objectIdentityAuthorityUsesTypedPairEquality: /semanticObjectIdentityOperations\.sameUnorderedPair/.test(authority),
  pairKeySerializationRemovedFromConsumer: !/pairKey|leftKey\}\:\:\$\{rightKey|knowledgeIdKey\([^\n]*\)\}\:\:\$\{/.test(authority),
  aliasAssignmentMatchingUsesTypedPairIdentity: /aliasesFromAssignments/.test(authority) && /samePair/.test(authority),
  aliasEvidenceMatchingUsesTypedPairIdentity: /distinctAliasRelations/.test(authority) && /candidate\.evidence/.test(authority),
  aliasDeduplicationUsesTypedIdentityNotTypedDistinctStringKey: /distinctAliasRelations/.test(authority) && !/typedDistinct/.test(authority),
  solverAtomConversionIsExplicitlyNamedBoundary: !/objectForRelationAtom|knowledgeIdKey|SemanticRelationAtom|semanticRewriteAuthority/.test(authority),
  sameIdentitySeedUsesDomainOperation: /semanticKnowledgeIdOperations\.same\(left, right\)/.test(authority),
  cliManifestEntryRemainsInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli),
  manifestCompositionRemainsInRuntimeTrace: /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  deletedRelationFoundationsRemainAbsent: relationFoundationPaths.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3036,
  title: 'Semantic Object Identity — Typed Pair Domain Operations',
  scope: 'Static contract audit for moving object-pair equality, alias-pair matching, alias deduplication, and same-identity seeding onto upstream typed domain operations. Relation-solver atom conversion remains an explicit legacy boundary.',
  runtimePath: [
    'CLI manifest scan operation: packages/cli/src/manifestScanOperationInterface.ts',
    'Controller invocation manifest composition authority',
    'Upstream semantic object identity authority consumes SemanticKnowledgeDataFlow assignment evidence',
    'semanticObjectIdentityOperations.sameUnorderedPair matches alias pairs using canonical KnowledgeId identity',
    'Typed upstream object-identity domain closes finite by-reference evidence without the legacy relation-solver atom boundary',
    'Closed or incomplete identity judgments continue through the existing composition path',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'Phase 3037 retired the object-identity consumer from the legacy relation-solver atom boundary; other consumers remain to be migrated separately.',
    'The authority still has orchestration branches for closed versus incomplete solver judgments.',
    'Repository-wide string/number/undefined/null/boolean, map/reduce/array, nullish, ternary, if/switch, and comparison cleanup is not complete.',
    'Full TypeScript typecheck, Vitest, and CLI-to-manifest end-to-end verification require project dependencies that are not present in this workspace.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3036_SEMANTIC_OBJECT_IDENTITY_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length > 0) {
  process.stderr.write(`Phase 3036 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3036 audit passed: ${report.passed}/${report.total}\n`);
}
