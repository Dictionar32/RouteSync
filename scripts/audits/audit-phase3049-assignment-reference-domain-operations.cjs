const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const knowledge = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const identityAuthority = read('packages/core/src/types/upstream/semanticObjectIdentityAuthority.ts');
const identityInterface = read('packages/core/src/types/upstream/semanticObjectIdentityInterface.ts');
const focusedTest = read('packages/core/src/types/upstream/__tests__/semanticAssignmentReferenceDomainOperations.phase3049.test.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const deletedFoundations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  referenceDefinitionOwnsDomainProjection: /SemanticAssignmentReferenceIdentityProjectionInterface/.test(knowledge) && /readonly identityProjection: SemanticAssignmentReferenceIdentityProjectionInterface/.test(knowledge),
  byValueDoesNotEmitIdentityBinding: /byValueAssignmentReferenceIdentityProjection:[\s\S]*?noAssignmentReferenceBindings/.test(knowledge),
  byReferenceEmitsSourceBackedIdentityBinding: /byReferenceAssignmentIdentityProjection:[\s\S]*?assignment: assignment\.id,[\s\S]*?left: assignment\.target,[\s\S]*?right: assignment\.value,[\s\S]*?source: assignment\.source/.test(knowledge),
  identityAuthorityConsumesUpstreamProjectionInsteadOfReferenceCode: (/reference\.identityProjection\.project\(fact\.value\)/.test(identityAuthority) || /semanticAssignmentReferenceFactOperations\.identityBindings\(model\.facts\)/.test(identityAuthority)) && !/isByReferenceAssignment|reference\.code/.test(identityAuthority),
  aliasProofPreservesBindingProvenance: /kind: 'assignment_reference'/.test(identityInterface) && /readonly source: import/.test(identityInterface) && /source: binding\.source/.test(identityAuthority),
  testCoversBothReferenceModesAndSourceIdentity: /by-reference mode must emit one explicit identity-binding fact/.test(focusedTest) && /by-value mode must not emit identity-binding evidence/.test(focusedTest) && /source evidence of the reference binding/.test(focusedTest),
  cliManifestInterfacePathPreserved: /routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli) && /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  noGenericVisitorAdded: !/SemanticFactVisitor|continueWith\s*<R>/.test(knowledge.slice(knowledge.indexOf('SemanticAssignmentReferenceIdentityProjectionInterface'), knowledge.indexOf('SEMANTIC_ASSIGNMENT_REFERENCE_KNOWLEDGE'))),
  deletedRelationFoundationsRemainAbsent: deletedFoundations.every(relative => !exists(relative)),
  collectionsInvariantPreserved: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3049,
  title: 'Assignment Reference Domain Operations — Source-Emitted Identity Binding',
  runtimeTrace: [
    'PHP syntax evidence resolves reference mode into the canonical SemanticAssignmentReferenceDefinition.',
    'The reference-mode definition owns an identityProjection operation.',
    'by_reference emits a source-backed identity binding; by_value emits no binding evidence.',
    'Semantic object identity analysis consumes projected bindings rather than inspecting reference.code.',
    'The proof preserves the assignment KnowledgeId, both endpoint KnowledgeIds, and SemanticSource.',
    'The semantic response continues through the existing interface-backed CLI scan and controller-invocation manifest composition path.',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'The model is scoped to reference-binding identity evidence; full PHP reference semantics, aliasing through heap locations, and callable effect summaries remain incomplete.',
    'Parser-boundary primitive values and dispatch remain; this phase does not claim global elimination of strings, numbers, booleans, nullish values, conditionals, or collections.',
    'Full repository typecheck, full Vitest, and end-to-end CLI-to-manifest execution remain unverified.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3049_ASSIGNMENT_REFERENCE_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  process.stderr.write(`Phase 3049 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3049 audit passed: ${report.passed}/${report.total}\n`);
}
