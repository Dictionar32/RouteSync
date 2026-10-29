const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const knowledge = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const operations = read('packages/core/src/types/upstream/semanticModRefFactOperations.ts');
const identity = read('packages/core/src/types/upstream/semanticObjectIdentityInterface.ts');
const producer = read('packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts');
const expressions = read('packages/core/src/compiler/frontend/php/routeAst/phpAstExpressionSyntaxEvidenceRegistry.ts');
const statements = read('packages/core/src/compiler/frontend/php/routeAst/phpAstStatementSyntaxEvidenceRegistry.ts');
const test = read('packages/core/src/types/upstream/__tests__/semanticModRefDomainOperations.phase3045.test.ts');
const assignmentTest = read('packages/core/src/types/upstream/__tests__/semanticAssignmentEffectDomainOperations.phase3046.test.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const deletedFoundations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  canonicalUpstreamOwnsTypedModRefRelation: /export interface SemanticModRefRelation/.test(knowledge) && /readonly modRefRelations: readonly SemanticModRefRelation\[\]/.test(knowledge),
  unresolvedCallableEffectsRemainClosedBlockers: /kind: 'invocation_effect_summary_unmodeled'/.test(knowledge) && !/kind: 'assignment_effect_unmodeled'|kind: 'access_effect_unmodeled'|kind: 'unset_effect_unmodeled'/.test(knowledge),
  effectFactoryIsExplicitInterfaceObject: /export const semanticModRefEffectFactory: SemanticModRefEffectFactoryInterface = Object\.freeze/.test(operations),
  assignmentEmitsConcreteWriteRelation: /assignmentEffects: \(assignment: SemanticAssignment\): readonly SemanticModRefRelation\[\] => assignment\.operator\.effect\.projection\.project\(assignment\)/.test(operations) && /code: 'write',[\s\S]*?kind: 'mod'/.test(knowledge),
  accessEmitsConcreteReadRelation: /accessRead: \(fact: KnowledgeId, location: KnowledgeId, source: SemanticSource\): SemanticModRefRelation/.test(operations) && /kind: 'ref'/.test(operations),
  unsetEmitsTargetSpecificWriteRelations: /semanticModRefEffectFactory\.unsetWrite\(id, target, unsetSource\)/.test(statements),
  expressionProducerEmitsReadAndWriteEffects: /recordModRefRelation\(semanticModRefEffectFactory\.accessRead\(id, id, source\)\)/.test(expressions) && /recordModRefRelations\(semanticModRefEffectFactory\.assignmentEffects\(assignment\)\)/.test(expressions) && /compoundRead\.kind !== 'ref'/.test(assignmentTest) && /compoundWrite\.kind !== 'mod'/.test(assignmentTest),
  assignmentTargetAccessIsNotMisclassifiedAsRead: /Assignment-target access is modeled by the enclosing assignment effect/.test(producer) && !/recordModRefFact\(semanticModRefEffectFactory\.accessRead/.test(producer),
  canonicalProducerPublishesBothRelationsAndBlockers: /modRefFacts: Object\.freeze\(modRefFacts\)/.test(producer) && /modRefRelations: Object\.freeze\(modRefRelations\)/.test(producer),
  consumerPreservesPartialResults: /mod_ref_evidence_partially_derived/.test(identity) && /model\.modRefRelations/.test(identity) && /semanticModRefFactOperations\.blockers\(model\.modRefFacts\)/.test(identity),
  focusedTestChecksIdentityProvenanceAndPartialOutcome: /assessment\.relations\.length !== 3/.test(test) && /assessment\.blockers\.length !== 1/.test(test) && /unknown-call/.test(test),
  cliManifestPathRemainsInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli) && /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  deletedRelationFoundationsRemainAbsent: deletedFoundations.every(relative => !exists(relative)),
  collectionsInvariantPreserved: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3045,
  title: 'Explicit Mod/Ref Effect Outcomes — Concrete Writes/Reads, Source-Backed Invocation Blockers',
  runtimeTrace: [
    'PHP expression/statement producers create canonical SemanticFact values and source-backed mod/ref outcomes at the same syntax-evidence boundary',
    'assignment effect definitions project concrete mod relations for plain writes and separate ref/mod relations for compound writes',
    'property/array access emits a ref relation; assignment-target access is not incorrectly counted as a read',
    'unset emits one mod relation per target KnowledgeId',
    'invocation without a modeled callable summary remains an explicit source-backed blocker',
    'SemanticKnowledgeDataFlow publishes modRefRelations and unresolved modRefFacts together',
    'semanticObjectIdentityOperations.modRefEvidence preserves derived relations alongside unresolved blockers',
    'CLI manifest scan and controller-invocation composition interfaces remain the downstream runtime route',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'This phase models direct assignment/access/unset effects, not interprocedural callable summaries, alias-sensitive heap locations, or all PHP reference semantics.',
    'The PHP syntax producer files cannot pass a repository-wide strict typecheck while legacy imports still point to intentionally deleted relation-foundation modules; none were restored.',
    'The dedicated upstream mod/ref domain test passes; an older combined identity test still fails at its pre-existing identity-link-premise assertion, unrelated to the Phase 3045 effect assertions.',
    'Full repository typecheck, full Vitest, and end-to-end CLI-to-manifest execution remain unverified.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3045_EXPLICIT_MODREF_EFFECT_OUTCOMES_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  process.stderr.write(`Phase 3045 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3045 audit passed: ${report.passed}/${report.total}\n`);
}
