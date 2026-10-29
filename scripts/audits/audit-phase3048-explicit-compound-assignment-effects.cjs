const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const knowledge = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const operations = read('packages/core/src/types/upstream/semanticModRefFactOperations.ts');
const expressionProducer = read('packages/core/src/compiler/frontend/php/routeAst/phpAstExpressionSyntaxEvidenceRegistry.ts');
const statementProducer = read('packages/core/src/compiler/frontend/php/routeAst/phpAstStatementSyntaxEvidenceRegistry.ts');
const adapter = read('packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts');
const focusedTest = read('packages/core/src/types/upstream/__tests__/semanticAssignmentEffectDomainOperations.phase3046.test.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const deletedFoundations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  effectDefinitionOwnsTypedDomainProjection: /SemanticAssignmentEffectProjectionInterface/.test(knowledge) && /readonly projection: SemanticAssignmentEffectProjectionInterface/.test(knowledge),
  writeOnlyAssignmentProjectsMod: /code: 'write',[\s\S]*?kind: 'mod'/.test(knowledge),
  compoundAssignmentProjectsSeparateRefAndMod: /code: 'read-write',[\s\S]*?kind: 'ref',[\s\S]*?kind: 'mod'/.test(knowledge),
  noCompositeModRefForCompoundAssignmentProjection: !/relationKind: 'mod-ref'/.test(knowledge) && /assignment\.operator\.effect\.projection\.project\(assignment\)/.test(operations),
  expressionProducerUsesDomainProjection: /recordModRefRelations\(semanticModRefEffectFactory\.assignmentEffects\(assignment\)\)/.test(expressionProducer),
  statementProducerUsesDomainProjection: /recordModRefRelations\(semanticModRefEffectFactory\.assignmentEffects\(assignment\)\)/.test(statementProducer),
  adapterPreservesEveryProjectedRelation: /recordModRefRelations:[\s\S]*?for \(const relation of relations\) recordModRefRelation\(relation\)/.test(adapter),
  testAssertsReadAndWriteAreDistinct: /compoundEffects\.length !== 2/.test(focusedTest) && /compoundRead\.kind !== 'ref'/.test(focusedTest) && /compoundWrite\.kind !== 'mod'/.test(focusedTest),
  runtimeCliManifestInterfacePathPreserved: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli) && /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  noVisitorSwitchOrLookupAddedToEffectProjection: !/\b(visitor|switch|lookup|Map)\b/.test(knowledge.slice(knowledge.indexOf('export interface SemanticAssignmentEffectProjectionInterface'), knowledge.indexOf('export const SEMANTIC_ASSIGNMENT_OPERATOR_KNOWLEDGE'))),
  deletedRelationFoundationsRemainAbsent: deletedFoundations.every(relative => !exists(relative)),
  collectionsInvariantPreserved: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3048,
  title: 'Explicit Compound Assignment Effects — Domain-Owned Read/Write Projection',
  runtimeTrace: [
    'PHP AST assignment expression or statement enters the corresponding syntax evidence producer',
    'producer creates one canonical SemanticAssignment and emits that exact assignment fact',
    'the assignment operator references an explicit SemanticAssignmentEffectDefinition',
    'the effect definition owns a typed project operation: plain assignment emits mod; compound assignment emits ref and mod',
    'the producer forwards every projected relation through the adapter-owned relation continuation',
    'SemanticKnowledgeDataFlow.modRefRelations preserves the relations for semanticObjectIdentityOperations.modRefEvidence',
    'integrated semantic response continues through the interface-backed CLI scan and controller-invocation manifest composition path',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'The parser boundary still resolves syntax operator codes into canonical operator definitions; no global primitive elimination is claimed.',
    'The separate ref/mod outcomes currently share the assignment source span and target identity; exact PHP evaluation order, indirect locations, and by-reference aliasing require further modeling.',
    'Callable effect summaries remain unresolved blockers.',
    'Full repository typecheck, full Vitest, and end-to-end CLI-to-manifest execution remain unverified.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3048_EXPLICIT_COMPOUND_ASSIGNMENT_EFFECTS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  process.stderr.write(`Phase 3048 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3048 audit passed: ${report.passed}/${report.total}\n`);
}
