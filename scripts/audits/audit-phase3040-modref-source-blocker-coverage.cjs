const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const contractPath = 'packages/core/src/types/upstream/semanticObjectIdentityInterface.ts';
const authorityPath = 'packages/core/src/types/upstream/semanticObjectIdentityAuthority.ts';
const factOpsPath = 'packages/core/src/types/upstream/semanticModRefFactOperations.ts';
const visitorPath = 'packages/core/src/types/upstream/semanticModRefFactOperations.ts';
const testPath = 'packages/core/src/types/upstream/__tests__/semanticObjectIdentityDomainOperations.phase3037.test.ts';
const contract = read(contractPath);
const authority = read(authorityPath);
const factOps = read(factOpsPath);
const knowledge = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const expressionProducer = read('packages/core/src/compiler/frontend/php/routeAst/phpAstExpressionSyntaxEvidenceRegistry.ts');
const statementProducer = read('packages/core/src/compiler/frontend/php/routeAst/phpAstStatementSyntaxEvidenceRegistry.ts');
const visitor = read(visitorPath);
const test = read(testPath);
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const removedFoundations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  modRefBlockersAreClosedTypedEvidence: /export type SemanticModRefBlocker\s*=/.test(factOps) && /assignment_effect_unmodeled/.test(factOps) && /invocation_effect_summary_unmodeled/.test(factOps) && /access_effect_unmodeled/.test(factOps) && /unset_effect_unmodeled/.test(factOps),
  blockerCarriesKnowledgeIdentityAndSource: /readonly fact: KnowledgeId/.test(knowledge) && /readonly source: SemanticSource/.test(knowledge),
  modRefOperationConsumesCanonicalKnowledge: /readonly modRefEvidence: \(model: SemanticKnowledgeDataFlow\) => SemanticModRefAnalysis/.test(contract) && /semanticObjectIdentityOperations\.modRefEvidence\(model\)/.test(authority),
  unresolvedStatusIsNotMisrepresentedAsComplete: /mod_ref_evidence_not_derived/.test(contract) && /mod_ref_domain_rules_not_implemented/.test(contract) && !/modRefs: Object\.freeze\(\[\]\)/.test(authority),
  candidateKindsRetainSourceBackedBlockers: /semanticModRefFactFactory\.assignment\(id, assignmentSource\)/.test(statementProducer) && /semanticModRefFactFactory\.unset\(id, unsetSource\)/.test(statementProducer) && /semanticModRefFactFactory\.invocation\(id, source\)/.test(expressionProducer) && /semanticModRefFactFactory\.access\(id, source\)/.test(expressionProducer),
  regressionCoversBlockerIdentityAndProvenance: /every assignment, invocation, access, and unset candidate/.test(test) && /must preserve source provenance/.test(test),
  canonicalKnowledgeGraphStillFeedsRuntime: /semanticObjectIdentityAuthority\.analyze\(knowledge\)/.test(read('packages/core/src/types/upstream/invocationSemanticPipeline.ts')),
  cliManifestTraceStillInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(read('packages/cli/src/manifestScanOperationInterface.ts')),
  deletedRelationFoundationsRemainAbsent: removedFoundations.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3040,
  title: 'Mod/Ref — Source-Backed Unresolved Blocker Coverage',
  scope: 'Make mod/ref incompleteness actionable by retaining the identity and source provenance of assignment, invocation, access, and unset facts whose domain rules are not yet implemented. This phase does not claim to derive mod/ref relations.',
  runtimePath: [
    'CLI manifest scan operation interface',
    'Controller invocation manifest composition',
    'invocation semantic pipeline supplies canonical SemanticKnowledgeDataFlow',
    'semanticObjectIdentityAuthority.analyze(model)',
    'semanticObjectIdentityOperations.modRefEvidence(model) consumes source-emitted model.modRefFacts',
    'typed blocker ADTs retain KnowledgeId and SemanticSource provenance in integrated object identity response',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'Actual mod/ref derivation rules and callable effect summaries remain unimplemented; blockers are surfaced honestly rather than converted into fabricated relations.',
    'This audit is static and does not replace full typecheck, behavior tests, or CLI-to-manifest end-to-end execution.',
    'Repository-wide elimination of primitive representations and control-flow constructs remains out of scope for this focused domain migration.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3040_MODREF_SOURCE_BLOCKER_COVERAGE_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length > 0) {
  process.stderr.write(`Phase 3040 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3040 audit passed: ${report.passed}/${report.total}\n`);
}
