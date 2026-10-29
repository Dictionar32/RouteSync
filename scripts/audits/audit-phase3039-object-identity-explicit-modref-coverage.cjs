const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const contractPath = 'packages/core/src/types/upstream/semanticObjectIdentityInterface.ts';
const authorityPath = 'packages/core/src/types/upstream/semanticObjectIdentityAuthority.ts';
const testPath = 'packages/core/src/types/upstream/__tests__/semanticObjectIdentityDomainOperations.phase3037.test.ts';
const contract = read(contractPath);
const authority = read(authorityPath);
const test = read(testPath);
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const removedFoundations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  modRefAnalysisIsClosedTypedOutcome: /mod_ref_evidence_not_derived/.test(contract) && /mod_ref_evidence_derived/.test(contract),
  missingRulesRemainExplicitBlocker: /mod_ref_domain_rules_not_implemented/.test(contract),
  analysisDoesNotPretendEmptyMeansComplete: /readonly modRefs: SemanticModRefAnalysis/.test(contract) && !/modRefs: Object\.freeze\(\[\]\)/.test(authority),
  domainOwnsModRefContinuationOperation: /readonly modRefEvidence: \(model: SemanticKnowledgeDataFlow\) => SemanticModRefAnalysis/.test(contract) && /modRefs: semanticObjectIdentityOperations\.modRefEvidence\(model\)/.test(authority),
  operationIsInterfaceBacked: /export const semanticObjectIdentityOperations: SemanticObjectIdentityOperationsInterface = Object\.freeze\(/.test(contract),
  aliasIdentityAndProofEvidencePreserved: /identityLinkPremises/.test(contract) && /proofFromAssignments/.test(authority),
  regressionCoversExplicitModRefBlocker: /missing mod\/ref semantics must remain an explicit blocker/.test(test),
  runtimeStillAnalyzesCanonicalKnowledge: /semanticObjectIdentityAuthority\.analyze\(knowledge\)/.test(read('packages/core/src/types/upstream/invocationSemanticPipeline.ts')),
  cliManifestTraceStillInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(read('packages/cli/src/manifestScanOperationInterface.ts')),
  deletedRelationFoundationsRemainAbsent: removedFoundations.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3039,
  title: 'Object Identity — Explicit Mod/Ref Coverage and Blocker Preservation',
  scope: 'Replace an unqualified empty modRefs array with a closed ADT that distinguishes unmodeled mod/ref semantics from a completed derivation, and expose its production through the object-identity domain operation.',
  runtimePath: [
    'CLI manifest scan operation interface',
    'Controller invocation manifest composition',
    'invocationSemanticPipeline uses the canonical semantic knowledge graph',
    'semanticObjectIdentityAuthority analyzes that graph',
    'semanticObjectIdentityOperations.modRefEvidence returns an explicit unmodeled-domain outcome',
    'Integrated response retains object identity analysis without claiming mod/ref completeness',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'Mod/ref inference rules are not implemented; this phase makes that limitation explicit instead of representing it as a complete empty list.',
    'This is a targeted upstream domain migration, not repository-wide elimination of primitive types, arrays, or control flow.',
    'Typecheck, Vitest, and CLI-to-manifest end-to-end execution remain unverified because dependencies are unavailable in this workspace.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3039_OBJECT_IDENTITY_EXPLICIT_MODREF_COVERAGE_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length > 0) {
  process.stderr.write(`Phase 3039 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3039 audit passed: ${report.passed}/${report.total}\n`);
}
