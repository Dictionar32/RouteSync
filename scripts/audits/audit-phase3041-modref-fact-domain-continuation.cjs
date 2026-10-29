const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const factOpsPath = 'packages/core/src/types/upstream/semanticModRefFactOperations.ts';
const identityPath = 'packages/core/src/types/upstream/semanticObjectIdentityInterface.ts';
const testPath = 'packages/core/src/types/upstream/__tests__/semanticObjectIdentityDomainOperations.phase3037.test.ts';
const factOps = read(factOpsPath);
const knowledge = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const identity = read(identityPath);
const test = read(testPath);
const modRefBody = identity.slice(identity.indexOf('const modRefEvidenceNotDerived'), identity.indexOf('export const semanticObjectIdentityOperations'));
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const removedFoundations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  sourceFactAssessmentHasClosedBlockerAdt: /export type SemanticModRefBlocker\s*=/.test(factOps) && /assignment_effect_unmodeled/.test(factOps) && /invocation_effect_summary_unmodeled/.test(factOps) && /access_effect_unmodeled/.test(factOps) && /unset_effect_unmodeled/.test(factOps),
  genericContinuationRetiredByPhase3043: !/SemanticModRefFactContinuation|continueWith: <R>/.test(factOps),
  identityContractDelegatesFactClassification: /semanticModRefFactOperations\.blockers\(model\.modRefFacts\)/.test(modRefBody),
  sourceIdentityAndProvenanceArePreserved: /readonly fact: KnowledgeId/.test(knowledge) && /readonly source: SemanticSource/.test(knowledge),
  canonicalModelStillFeedsModRefOperation: /readonly modRefEvidence: \(model: SemanticKnowledgeDataFlow\) => SemanticModRefAnalysis/.test(identity) && /semanticObjectIdentityOperations\.modRefEvidence\(model\)/.test(read('packages/core/src/types/upstream/semanticObjectIdentityAuthority.ts')),
  regressionExercisesConcreteAssessment: /producer-emitted assignment effect must remain a concrete domain fact/.test(test) && /consuming explicit effect facts must preserve every blocker/.test(test),
  runtimePipelineStillUsesCanonicalKnowledge: /semanticObjectIdentityAuthority\.analyze\(knowledge\)/.test(read('packages/core/src/types/upstream/invocationSemanticPipeline.ts')),
  cliManifestOperationRemainsInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(read('packages/cli/src/manifestScanOperationInterface.ts')),
  deletedRelationFoundationsRemainAbsent: removedFoundations.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3041,
  title: 'Mod/Ref Fact Domain Continuation — Superseded by Concrete Phase 3043 Contract',
  scope: 'Historical checkpoint updated to verify the Phase 3043 correction: generic continuation is retired, concrete mod/ref assessments are consumed by a domain aggregation operation, and no mod/ref inference is fabricated.',
  runtimePath: [
    'CLI manifest scan operation interface',
    'controller invocation manifest composition',
    'invocation semantic pipeline provides canonical SemanticKnowledgeDataFlow',
    'semanticObjectIdentityAuthority.analyze(model)',
    'semanticObjectIdentityOperations.modRefEvidence(model)',
    'canonical producer emits typed modRefFacts beside SemanticFact',
    'semanticModRefFactOperations.blockers(facts) aggregates source-backed blockers',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'Phase 3044 supersedes the consumer-side classifier by emitting effect evidence at canonical fact construction sites.',
    'Mod/ref inference rules and callable effect summaries remain unimplemented; source-backed blockers remain explicit.',
    'Static audit does not replace full typecheck, Vitest, or CLI-to-manifest end-to-end verification.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3041_MODREF_FACT_DOMAIN_CONTINUATION_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  process.stderr.write(`Phase 3041 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3041 audit passed: ${report.passed}/${report.total}\n`);
}
