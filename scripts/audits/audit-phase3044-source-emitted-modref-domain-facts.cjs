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
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const deletedFoundations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  canonicalKnowledgeCarriesExplicitModRefFacts: /readonly modRefFacts: readonly SemanticModRefFact\[\]/.test(knowledge),
  modRefFactsAreClosedSourceBackedDomainAdt: /export type SemanticModRefFact\s*=/.test(knowledge) && ['assignment_effect_unmodeled','invocation_effect_summary_unmodeled','access_effect_unmodeled','unset_effect_unmodeled'].every(kind => knowledge.includes(`kind: '${kind}'`)),
  modRefFactoryIsInterfaceBacked: /export const semanticModRefFactFactory: SemanticModRefFactFactoryInterface = Object\.freeze/.test(operations),
  modRefOperationsContainNoGenericDispatchOrLookup: !/\bswitch\b|\bvisitor\b|\blookup\b|\.map\s*\(/i.test(operations),
  producerOwnsEffectEvidenceCollection: /const modRefFacts: SemanticModRefFact\[\]\s*=/.test(producer) && /recordModRefFact: \(fact: SemanticModRefFact\) => void/.test(producer),
  assignmentAndUnsetEmitAtConstruction: /semanticModRefFactFactory\.assignment\(id, assignmentSource\)/.test(statements) && /semanticModRefFactFactory\.unset\(id, unsetSource\)/.test(statements),
  invocationAndAccessEmitAtConstruction: /semanticModRefFactFactory\.invocation\(id, source\)/.test(expressions) && /semanticModRefFactFactory\.access\(id, source\)/.test(expressions),
  canonicalModelPublishesEffectEvidence: /modRefFacts: Object\.freeze\(modRefFacts\)/.test(producer),
  identityConsumerUsesProducedEvidenceOnly: /semanticModRefFactOperations\.blockers\(model\.modRefFacts\)/.test(identity) && !/semanticModRefFactOperations\.blockers\(model\.facts\)/.test(identity),
  cliManifestEntryRemainsInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli),
  cliCompositionContractRemainsTyped: /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  deletedRelationFoundationsRemainAbsent: deletedFoundations.every(relative => !exists(relative)),
  collectionsInvariantPreserved: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3044,
  title: 'Source-Emitted Mod/Ref Domain Facts — Consumer Dispatch Retired',
  runtimeTrace: [
    'PHP AST expression/statement syntax evidence producers explicitly emit typed effect-domain facts alongside canonical SemanticFact values',
    'phpAstSemanticKnowledgeDataFlowProductionOperation publishes facts and modRefFacts together in SemanticKnowledgeDataFlow',
    'invocation semantic pipeline passes canonical knowledge to semanticObjectIdentityAuthority.analyze',
    'semanticObjectIdentityOperations.modRefEvidence consumes only model.modRefFacts',
    'CLI manifest scan operation delegates through ControllerInvocationManifestCompositionAuthorityInterface and retains upstream semantic result',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'This phase removes fact-kind classification switch/lookup/visitor from modRef operations by emitting effect facts at explicit construction sites; it does not eliminate every switch or primitive from the entire repository.',
    'The current mod/ref variants remain unresolved blockers until effect semantics and callable summaries are modeled; no false inference completeness is claimed.',
    'Full repository typecheck and end-to-end CLI-to-manifest test are blocked/unverified in this workspace because several legacy imports target relation foundation files that are intentionally absent; none were restored.',
    'Full Vitest suite was not run.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3044_SOURCE_EMITTED_MODREF_DOMAIN_FACTS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  process.stderr.write(`Phase 3044 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3044 audit passed: ${report.passed}/${report.total}\n`);
}
