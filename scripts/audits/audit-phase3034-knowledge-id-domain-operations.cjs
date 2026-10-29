const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const knowledge = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const authority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const focusedTest = read('packages/core/src/types/upstream/__tests__/knowledge-id-domain-operations.phase3034.test.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationFoundationPaths = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  knowledgeIdHasClosedEqualityJudgment: /export type KnowledgeIdEquality =[\s\S]*?same_knowledge_id[\s\S]*?different_knowledge_id/.test(knowledge),
  knowledgeIdOperationsAreInterfaceBacked: /export interface SemanticKnowledgeIdOperationsInterface[\s\S]*?readonly same:/.test(knowledge) && /export const semanticKnowledgeIdOperations: SemanticKnowledgeIdOperationsInterface = Object\.freeze\(/.test(knowledge),
  knowledgeIdentityUsesSourceRoleAndSlot: /semanticSource\.same\(left\.identity\.source, right\.identity\.source\)[\s\S]*?left\.identity\.role[\s\S]*?left\.identity\.slot\.value/.test(knowledge),
  invocationAuthorityUsesTypedKnowledgeIdentity: /semanticKnowledgeIdOperations/.test(authority) && !/knowledgeIdKey/.test(authority),
  invocationAuthorityDoesNotSerializeIdentityKeys: !/const id\s*=/.test(authority) && !/obligationKey/.test(authority) && !/JSON\.stringify/.test(authority),
  invocationAuthorityDoesNotProjectTraceThroughMap: !/trace\.map\(/.test(authority),
  obligationIdentityUsesClosedDomainComparison: /const sameObligationIdentity[\s\S]*?case 'argument_parameter_unresolved'[\s\S]*?case 'callable_target_ambiguous'/.test(authority),
  focusedTestCoversSourceRoleAndSlot: /same_knowledge_id/.test(focusedTest) && /different_knowledge_id/.test(focusedTest) && /argument/.test(focusedTest),
  cliManifestEntryRemainsInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli),
  manifestCompositionRemainsInRuntimeTrace: /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  deletedRelationFoundationsRemainAbsent: relationFoundationPaths.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3034,
  title: 'KnowledgeId — Interface-Backed Typed Identity Operations',
  scope: 'Static contract audit for replacing string-key identity comparisons in the invocation semantic authority with typed KnowledgeId equality and closed obligation identity comparison.',
  runtimePath: [
    'CLI manifest scan operation: packages/cli/src/manifestScanOperationInterface.ts',
    'Controller invocation manifest composition authority',
    'Invocation semantic judgment authority validates requested invocation, argument correspondence, target, effect flow, trace, and obligations',
    'semanticKnowledgeIdOperations.same compares source provenance, semantic role, and slot as a typed equality judgment',
    'sameObligationIdentity compares obligation variant and domain identities without serializing a composite key',
    'Existing proof trace, unresolved obligations, and rejection behavior remain in place',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'knowledgeIdKey remains a derived lookup key for other legacy semantic-algebra and object-identity consumers; this phase removes it only from invocationSemanticJudgmentAuthority.ts.',
    'Other semantic algebra consumers still contain indexes, arrays, and control flow; this phase does not claim repository-wide elimination of map/reduce, primitive values, or branches.',
    'The focused Vitest test is added but not claimed as executed unless project dependencies are available.',
    'Full TypeScript typecheck, full Vitest, and CLI-to-manifest end-to-end execution remain unverified.',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE3034_KNOWLEDGE_ID_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  console.error(`Phase 3034 audit failed: ${failed.map(([name]) => name).join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Phase 3034 audit passed: ${report.passed}/${report.total}`);
}
