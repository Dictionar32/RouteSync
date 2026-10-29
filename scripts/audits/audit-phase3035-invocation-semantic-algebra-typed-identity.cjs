const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const algebra = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const knowledge = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationFoundationPaths = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const candidateBlock = algebra.match(/const candidateCallablesFor = \([\s\S]*?\n};/);
const effectBlock = algebra.match(/const deriveEffectProjection = \([\s\S]*?\n};/);
const checks = {
  invocationAlgebraUsesInterfaceBackedKnowledgeIdOperations: /semanticKnowledgeIdOperations/.test(algebra) && /const sameKnowledgeId = \(left: KnowledgeId, right: KnowledgeId\): boolean/.test(algebra),
  invocationAlgebraNoLongerImportsDerivedStringKey: !/knowledgeIdKey|const key\s*=/.test(algebra),
  invocationPresenceUsesTypedIdentity: /invocationsFrom\(knowledge\)\.some\(candidate => sameKnowledgeId\(candidate\.id, invocation\.id\)\)/.test(algebra),
  candidateCallableLookupUsesTypedIdentity: Boolean(candidateBlock) && /sameKnowledgeId\(flow\.source, invocation\.id\)/.test(candidateBlock[0]) && /sameKnowledgeId\(targetId, callable\.id\)/.test(candidateBlock[0]) && !/\.map\(|new Set/.test(candidateBlock[0]),
  candidateCallablesDeduplicateByDomainIdentity: Boolean(candidateBlock) && /distinct\.some\(existing => sameKnowledgeId\(existing\.id, candidate\.id\)\)/.test(candidateBlock[0]),
  positionalArgumentEvidenceUsesTypedIdentity: /sameKnowledgeId\(positionalEvidence\.invocation, invocation\.id\)/.test(algebra) && /sameKnowledgeId\(argument, expected\)/.test(algebra),
  effectProjectionMatchesDeclaredEmissionsByTypedIdentity: Boolean(effectBlock) && /callable\.emissions\.some\(declared => sameKnowledgeId\(declared, emission\.id\)\)/.test(effectBlock[0]) && !/declaredEmissionIds/.test(effectBlock[0]),
  obligationDeduplicationUsesTypedIdentity: /sameKnowledgeId\(existing\.invocation\.id, obligation\.invocation\.id\)/.test(algebra) && /sameKnowledgeId\(existing\.argument, obligation\.argument\)/.test(algebra),
  invocationTraceAndQueriesUseTypedIdentity: /sameKnowledgeId\(entry\.subjectInvocation, input\.invocation\.id\)/.test(algebra) && /sameKnowledgeId\(target\.invocation\.id, invocation\)/.test(algebra) && /sameKnowledgeId\(judgment\.invocation\.id, invocation\)/.test(algebra),
  sourceKnowledgeIdentityIsInterfaceBacked: /export interface SemanticKnowledgeIdOperationsInterface/.test(knowledge) && /export const semanticKnowledgeIdOperations: SemanticKnowledgeIdOperationsInterface = Object\.freeze\(/.test(knowledge),
  cliManifestEntryRemainsInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli),
  manifestCompositionRemainsInRuntimeTrace: /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  deletedRelationFoundationsRemainAbsent: relationFoundationPaths.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3035,
  title: 'Invocation Semantic Algebra — Typed KnowledgeId Identity',
  scope: 'Static contract audit for migrating invocation-semantic-algebra identity matching from derived string keys to upstream KnowledgeId domain operations.',
  runtimePath: [
    'CLI manifest scan operation: packages/cli/src/manifestScanOperationInterface.ts',
    'Controller invocation manifest composition authority',
    'Invocation semantic judgment algebra resolves invocation presence, callable targets, positional argument evidence, declared emissions, obligations, and trace subjects',
    'semanticKnowledgeIdOperations.same compares source provenance, semantic role, and slot',
    'Existing invocation judgments, evidence, effect flows, and unresolved obligations continue to feed the established manifest composition path',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'Other semantic algebra operations still use map/filter/flatMap and branch constructs for projections and closed ADT handling; this phase only removes derived KnowledgeId key use and selected key-backed lookup collections in this consumer.',
    'semanticObjectIdentityAuthority.ts still adapts KnowledgeId values to the legacy semantic rewrite relation atom format; replacing that boundary requires an explicit typed rewrite-domain migration, not a replacement generic relation foundation.',
    'Primitive values remain at parser and source-coordinate boundaries; this phase does not claim repository-wide primitive elimination.',
    'Focused static audit does not establish successful TypeScript typecheck, Vitest execution, or CLI-to-manifest end-to-end behavior.',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE3035_INVOCATION_SEMANTIC_ALGEBRA_TYPED_IDENTITY_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  console.error(`Phase 3035 audit failed: ${failed.map(([name]) => name).join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Phase 3035 audit passed: ${report.passed}/${report.total}`);
}
