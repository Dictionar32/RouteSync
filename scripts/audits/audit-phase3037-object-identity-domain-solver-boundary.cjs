const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const authority = read('packages/core/src/types/upstream/semanticObjectIdentityAuthority.ts');
const contract = read('packages/core/src/types/upstream/semanticObjectIdentityInterface.ts');
const consumer = read('packages/core/src/compiler/frontend/php/routeAst/semanticObjectIdentityRelations.ts');
const runtimePipeline = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const runtimeContract = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const test = read('packages/core/src/types/upstream/__tests__/semanticObjectIdentityDomainOperations.phase3037.test.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const removedFoundations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  authorityNoLongerImportsGenericRelationSolver: !/semanticRewriteAuthority|SemanticRelationAtom|solveSemanticRelationsDetailed|SEMANTIC_OBJECT_IDENTITY_RULES/.test(authority),
  authorityNoLongerSerializesKnowledgeIdentity: !/knowledgeIdKey|JSON\.stringify|relationAtom|objectForRelationAtom/.test(authority),
  authorityUsesTypedKnowledgeIdentityOperations: /semanticKnowledgeIdOperations\.same/.test(authority),
  pairComparisonRemainsDomainOwned: /semanticObjectIdentityOperations\.sameUnorderedPair/.test(authority) && /sameUnorderedPairOperation/.test(contract),
  exportedAnalysisUsesInterfaceBackedObject: /export const analyzeSemanticObjectIdentityOperation: SemanticObjectIdentityAnalysisOperationInterface = Object\.freeze\(\{ execute: analyze \}\)/.test(authority),
  exportedAliasUsesInterfaceBackedObject: /export const semanticAliasAssessmentOperation: SemanticAliasAssessmentOperationInterface = Object\.freeze\(\{ execute: alias \}\)/.test(authority),
  authorityExportsExplicitInterface: /export const semanticObjectIdentityAuthority: SemanticObjectIdentityAuthorityInterface = Object\.freeze\(/.test(authority),
  finiteEvidenceClosureIsTyped: /closure: 'finite_domain_evidence'/.test(authority) && /SemanticObjectIdentityProofFact/.test(contract),
  duplicateAliasEvidenceIsPreserved: /evidence: Object\.freeze\(\[\.\.\.existing\.evidence, \.\.\.candidate\.evidence\]\)/.test(authority),
  byReferenceOnlyCreatesAliasFacts: /isByReferenceAssignment/.test(authority) && /assignment\.reference\.code, 'by_reference'/.test(authority),
  noArrayMapOrFlatMapInAuthority: !/\.map\(|\.flatMap\(|\.reduce\(/.test(authority),
  runtimeConsumerUsesAuthorityObject: /semanticObjectIdentityAuthority/.test(consumer) && !/analyzeSemanticObjectIdentity, semanticAlias/.test(consumer),
  integratedRuntimeActuallyExecutesObjectIdentity: /semanticObjectIdentityAuthority\.analyze\(knowledge\)/.test(runtimePipeline) && /objectIdentity,/.test(runtimePipeline),
  integratedResponsePublishesDerivedIdentityWithoutDuplicatingKnowledge: /readonly objectIdentity: SemanticObjectIdentityAnalysis/.test(runtimeContract) && /objectIdentityOwnership/.test(runtimeContract) && /objectIdentityBinding/.test(runtimeContract),
  regressionTestPreservesEvidenceAndAliasSemantics: exists('packages/core/src/types/upstream/__tests__/semanticObjectIdentityDomainOperations.phase3037.test.ts') && /evidence\.length !== 2/.test(test) && /by_reference/.test(test) && /by_value/.test(test),
  cliManifestEntryRemainsInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli),
  manifestCompositionRemainsInRuntimeTrace: /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  deletedRelationFoundationsRemainAbsent: removedFoundations.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3037,
  title: 'Object Identity — Domain-Owned Solver Boundary Retirement',
  scope: 'Static audit that retires the object-identity consumer from string-atom relation solving and moves finite alias closure into typed upstream domain evidence while preserving assignment provenance.',
  runtimePath: [
    'CLI manifest scan operation: packages/cli/src/manifestScanOperationInterface.ts',
    'Controller invocation manifest composition authority',
    'Upstream SemanticKnowledgeDataFlow assignment evidence',
    'Invocation integrated-response composition reuses the exact canonical knowledge reference',
    'Interface-backed semanticObjectIdentityAuthority executes on that runtime knowledge value',
    'Typed KnowledgeId equality and pair identity operations',
    'Domain-owned alias evidence and proof derivations are retained as objectIdentity in the integrated response without duplicating the knowledge graph',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'This phase retires only the object-identity consumer from the legacy relation-solver boundary; other upstream solver consumers require separate domain migrations.',
    'TypeScript compilation, Vitest execution, and end-to-end CLI-to-manifest tests remain unverified because workspace dependencies are unavailable.',
    'Primitive representations at PHP parser boundaries and in other semantic domains have not been globally eliminated.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3037_OBJECT_IDENTITY_DOMAIN_SOLVER_BOUNDARY_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length > 0) {
  process.stderr.write(`Phase 3037 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3037 audit passed: ${report.passed}/${report.total}\n`);
}
