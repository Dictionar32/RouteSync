const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const authorityPath = 'packages/core/src/types/upstream/semanticObjectIdentityAuthority.ts';
const contractPath = 'packages/core/src/types/upstream/semanticObjectIdentityInterface.ts';
const authority = read(authorityPath);
const contract = read(contractPath);
const test = read('packages/core/src/types/upstream/__tests__/semanticObjectIdentityDomainOperations.phase3037.test.ts');
const runtime = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const removedFoundations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  knowledgeIdMembershipIsClosedTypedJudgment: /knowledge_id_present/.test(contract) && /knowledge_id_absent/.test(contract),
  aliasPairMembershipIsClosedTypedJudgment: /semantic_alias_pair_present/.test(contract) && /semantic_alias_pair_absent/.test(contract),
  proofPremiseSelectionIsDomainOperation: /identityLinkPremises/.test(contract) && /identityLinkPremises\(proof, \[left, right\]\)/.test(authority),
  identityDedupUsesTypedMembershipOperation: /semanticObjectIdentityOperations\.membership\(output, candidate\)/.test(authority),
  aliasDedupPreservesAllEvidence: /evidence: Object\.freeze\(\[\.\.\.existing\.evidence, \.\.\.candidate\.evidence\]\)/.test(authority),
  noCollectionLookupCombinatorsInAuthority: !/\.map\(|\.flatMap\(|\.reduce\(|\.filter\(|\.some\(|\.findIndex\(/.test(authority),
  noTernaryOrSwitchInAuthority: !/\?[^.]|\bswitch\s*\(/.test(authority),
  noStrictEqualityOperatorInDomainAuthority: !/===|!==/.test(authority),
  exportedOperationsRemainInterfaceBacked: /export const semanticObjectIdentityOperations: SemanticObjectIdentityOperationsInterface = Object\.freeze\(/.test(contract),
  aliasLookupIsDomainOwned: /semanticObjectIdentityOperations\.aliasPairMembership\(analysis\.aliases, \[left, right\]\)/.test(authority),
  regressionCoversMembershipAndProofEvidence: /KnowledgeId membership must return a typed present judgment/.test(test) && /unordered alias-pair membership/.test(test) && /identity-link premise selection/.test(test),
  runtimePipelineStillExecutesObjectIdentity: /semanticObjectIdentityAuthority\.analyze\(knowledge\)/.test(runtime) && /objectIdentity,/.test(runtime),
  cliManifestTraceRemainsInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli) && /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  deletedRelationFoundationsRemainAbsent: removedFoundations.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3038,
  title: 'Object Identity — Explicit Membership and Proof-Premise Domain Operations',
  scope: 'Move identity membership, alias-pair matching, and identity-link premise selection behind explicit upstream domain operations and remove collection lookup combinators from the object identity runtime authority.',
  runtimePath: [
    'CLI manifest scan operation: packages/cli/src/manifestScanOperationInterface.ts',
    'Controller invocation manifest composition authority',
    'Invocation semantic pipeline reuses canonical SemanticKnowledgeDataFlow',
    'semanticObjectIdentityAuthority analyzes canonical knowledge and publishes objectIdentity',
    'semanticObjectIdentityOperations owns KnowledgeId membership, unordered alias-pair membership, and proof-premise selection',
    'Alias evidence and proof derivations remain attached to the typed analysis result',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'The TypeScript type predicate isAssignmentFact remains at the discriminated-fact boundary to preserve safe narrowing without an unsafe assertion.',
    'The migration is scoped to the object-identity authority; it does not claim repository-wide elimination of primitive types or all control constructs.',
    'Typecheck, Vitest, and CLI-to-manifest end-to-end execution remain unverified because project dependencies are unavailable.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3038_OBJECT_IDENTITY_EXPLICIT_MEMBERSHIP_OPERATIONS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length > 0) {
  process.stderr.write(`Phase 3038 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3038 audit passed: ${report.passed}/${report.total}\n`);
}
