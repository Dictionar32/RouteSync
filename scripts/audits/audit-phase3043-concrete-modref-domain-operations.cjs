const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const modRef = read('packages/core/src/types/upstream/semanticModRefFactOperations.ts');
const knowledge = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const identity = read('packages/core/src/types/upstream/semanticObjectIdentityInterface.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const removedFoundations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  genericVisitorModuleRetired: !exists('packages/core/src/types/upstream/semanticFactOperations.ts'),
  noGenericVisitorOrGenericContinuationInModRefContract: !/SemanticFactVisitor|SemanticModRefFactContinuation|continueWith\s*:\s*<R>/.test(modRef),
  concreteModRefAssessmentIsClosedDomainAdt: /export type SemanticModRefFact\s*=/.test(knowledge) && /assignment_effect_unmodeled/.test(knowledge) && /invocation_effect_summary_unmodeled/.test(knowledge) && /access_effect_unmodeled/.test(knowledge) && /unset_effect_unmodeled/.test(knowledge),
  domainOperationsAreInterfaceBacked: /export interface SemanticModRefFactOperationsInterface/.test(modRef) && /export const semanticModRefFactOperations: SemanticModRefFactOperationsInterface = Object\.freeze/.test(modRef),
  identityConsumerUsesDomainAggregation: /semanticModRefFactOperations\.blockers\(model\.modRefFacts\)/.test(identity) && !/\.continueWith\(\{\s*blocker:/.test(identity),
  sourceIdentityAndProvenanceRetained: /readonly fact: KnowledgeId/.test(knowledge) && /readonly source: SemanticSource/.test(knowledge),
  runtimePipelineUsesCanonicalKnowledge: /semanticObjectIdentityAuthority\.analyze\(knowledge\)/.test(pipeline),
  cliEntryIsInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli),
  compositionAuthorityIsTyped: /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  deletedRelationFoundationsRemainAbsent: removedFoundations.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3043,
  title: 'Concrete Mod/Ref Domain Operations — Generic Visitor Retired',
  runtimePath: [
    'CLI scan/sync → routeSyncCliManifestScanOperationFactory.create(authority).scan(input)',
    'ControllerInvocationManifestCompositionAuthorityInterface.compose(input)',
    'invocation semantic integrated response composition obtains canonical SemanticKnowledgeDataFlow',
    'semanticObjectIdentityAuthority.analyze(knowledge)',
    'semanticObjectIdentityOperations.modRefEvidence(model)',
    'semanticModRefFactOperations.blockers(model.modRefFacts)',
    'closed SemanticModRefFact preserves blocker KnowledgeId and SemanticSource',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'Phase 3044 moves effect classification to explicit source fact construction sites; the mod/ref consumer no longer dispatches on SemanticFact.kind.',
    'The canonical model now carries source-emitted effect evidence beside facts; later work should model actual effects and callable summaries without recreating generic visitors.',
    'This phase does not claim repository-wide removal of string, number, boolean, undefined, null, reduce, empty arrays, nullish coalescing, ternaries, if, equality checks, type predicates/assertions, lookup tables, switch, map, or exported function declarations.',
    'Mod/ref inference rules and callable effect summaries remain unimplemented; blockers remain explicit and source-backed.',
    'Full repository typecheck, complete Vitest, and CLI-to-manifest end-to-end execution were not run.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3043_CONCRETE_MODREF_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  process.stderr.write(`Phase 3043 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3043 audit passed: ${report.passed}/${report.total}\n`);
}
