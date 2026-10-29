const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const factOpsPath = 'packages/core/src/types/upstream/semanticFactOperations.ts';
const factOps = exists(factOpsPath) ? read(factOpsPath) : '';
const concreteOps = read('packages/core/src/types/upstream/semanticModRefFactOperations.ts');
const modRef = read('packages/core/src/types/upstream/semanticModRefFactOperations.ts');
const identity = read('packages/core/src/types/upstream/semanticObjectIdentityInterface.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const sourceFacts = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const removedFoundations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const semanticFactUnion = sourceFacts.slice(sourceFacts.indexOf('export type SemanticFact ='), sourceFacts.indexOf('export type SemanticKnowledgeRoleCode'));
const kinds = [...semanticFactUnion.matchAll(/readonly kind: '([^']+)';\n\s+readonly value: \w+;/g)].map(match => match[1]);
const visitorKinds = [...factOps.matchAll(/readonly '([^']+)': \(fact: SemanticFactVariant<'[^']+'>\) => R;/g)].map(match => match[1]);
const checks = {
  genericVisitorRetiredAfterReview: !exists(factOpsPath) && !/SemanticFactVisitor|continueWith: <R>/.test(concreteOps),
  canonicalFactUnionStillClosed: kinds.length >= 30 && kinds.includes('assignment') && kinds.includes('invocation') && kinds.includes('access') && kinds.includes('unset'),
  concreteModRefAssessmentIsInterfaceBacked: /export interface SemanticModRefFactOperationsInterface/.test(concreteOps) && /export const semanticModRefFactOperations: SemanticModRefFactOperationsInterface = Object\.freeze/.test(concreteOps),
  modRefClassificationOwnedByConcreteDomain: /readonly assess: \(fact: SemanticFact\) => SemanticModRefFactAssessment/.test(concreteOps) && /readonly blockers: \(facts: readonly SemanticFact\[\]\)/.test(concreteOps),
  modRefBlockersKeepSourceIdentity: /readonly fact: KnowledgeId; readonly source: SemanticSource/.test(modRef),
  identityContractDelegatesModRefClassification: /semanticModRefFactOperations\.blockers\(model\.facts\)/.test(identity),
  cliManifestRuntimeEntryRemainsInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli),
  deletedRelationFoundationsRemainAbsent: removedFoundations.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3042,
  title: 'Semantic Fact Visitor Review — Generic Visitor Retired in Phase 3043',
  scope: 'Review record: Phase 3042 generic visitor was rejected and removed in Phase 3043. This audit verifies the concrete domain replacement and records the remaining dispatch debt.',
  semanticFactVariants: kinds.length,
  runtimePath: [
    'CLI manifest scan interface',
    'controller invocation manifest composition',
    'invocation semantic pipeline creates canonical SemanticKnowledgeDataFlow',
    'semanticObjectIdentityAuthority.analyze(model)',
    'semanticObjectIdentityOperations.modRefEvidence(model)',
    'semanticModRefFactOperations.assess(fact) returns a concrete mod/ref assessment',
    'semanticModRefFactOperations.blockers(facts) aggregates source-backed blockers'
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'A switch remains inside the mod/ref domain operation. Removing it honestly requires effect classification to be emitted at canonical fact construction, not replaced by a generic visitor or disguised lookup.',
    'This phase does not claim elimination of all string, number, boolean, null, undefined, array, reduce, map, if, ternary, or switch occurrences repository-wide.',
    'Mod/ref inference rules and callable effect summaries remain unimplemented; source-backed blockers remain explicit.',
    'Static audits and targeted TypeScript checks do not replace full repository typecheck, complete Vitest, or CLI-to-manifest end-to-end verification.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3042_SEMANTIC_FACT_VISITOR_OPERATIONS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  process.stderr.write(`Phase 3042 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3042 audit passed: ${report.passed}/${report.total}; semantic fact variants=${kinds.length}\n`);
}
