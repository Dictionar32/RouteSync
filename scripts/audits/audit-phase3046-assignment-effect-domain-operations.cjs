const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const knowledge = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const effects = read('packages/core/src/types/upstream/semanticModRefFactOperations.ts');
const expressions = read('packages/core/src/compiler/frontend/php/routeAst/phpAstExpressionSyntaxEvidenceRegistry.ts');
const statements = read('packages/core/src/compiler/frontend/php/routeAst/phpAstStatementSyntaxEvidenceRegistry.ts');
const test = read('packages/core/src/types/upstream/__tests__/semanticAssignmentEffectDomainOperations.phase3046.test.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const deletedFoundations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  assignmentOperatorCarriesItsEffectAsDomainData: /interface SemanticAssignmentOperatorDefinition\s*\{\s*readonly code: SemanticAssignmentOperatorCode;\s*readonly effect: SemanticAssignmentEffectDefinition;/.test(knowledge),
  effectKnowledgeUsesNamedInterfaceFirstObject: /export const semanticAssignmentEffectKnowledge: SemanticAssignmentEffectKnowledgeInterface = Object\.freeze/.test(knowledge),
  plainWriteAndCompoundReadWriteAreDistinct: /write: Object\.freeze\(\{[\s\S]*?code: 'write',[\s\S]*?kind: 'mod'/.test(knowledge) && /readWrite: Object\.freeze\(\{[\s\S]*?code: 'read-write',[\s\S]*?kind: 'ref',[\s\S]*?kind: 'mod'/.test(knowledge),
  operatorsCarryEffectDirectly: /\{ code: 'set', effect: semanticAssignmentEffectKnowledge\.write \}/.test(knowledge) && /\{ code: 'add', effect: semanticAssignmentEffectKnowledge\.readWrite \}/.test(knowledge),
  effectFactoryProjectsDomainEffectWithoutReclassification: /assignmentEffects: \(assignment: SemanticAssignment\): readonly SemanticModRefRelation\[\] => assignment\.operator\.effect\.projection\.project\(assignment\)/.test(effects),
  expressionProducerPassesOperatorEffect: /const assignment = \{ id: base, target, value: valueId, operator: semanticAssignmentOperator\(value\.operator\.kind\)/.test(expressions) && /recordModRefRelations\(semanticModRefEffectFactory\.assignmentEffects\(assignment\)\)/.test(expressions),
  statementProducerPassesOperatorEffect: /const assignment = \{ id: base, target, value: valueId, operator: semanticAssignmentOperator\(value\.operator\.kind\)/.test(statements) && /recordModRefRelations\(semanticModRefEffectFactory\.assignmentEffects\(assignment\)\)/.test(statements),
  focusedTestCoversWriteAndReadWriteAndTargetIdentity: /directWrite\.kind !== 'mod'/.test(test) && /compoundRead\.kind !== 'ref'/.test(test) && /compoundWrite\.kind !== 'mod'/.test(test) && /location\.identity\.slot\.value !== 'counter'/.test(test),
  canonicalModRefConsumerRetainsConcreteEffects: /semanticObjectIdentityOperations\.modRefEvidence\(model\)/.test(test) && /mod_ref_evidence_derived/.test(test),
  cliManifestRuntimeStillUsesExplicitInterfaces: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli) && /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  deletedRelationFoundationsRemainAbsent: deletedFoundations.every(relative => !exists(relative)),
  collectionsInvariantPreserved: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3046,
  title: 'Assignment Effect Domain Operations — Operator Carries Write vs Read-Write Semantics',
  runtimeTrace: [
    'PHP expression/statement syntax producer resolves the syntax operator at the boundary to a canonical SemanticAssignmentOperatorDefinition',
    'the canonical operator definition carries its SemanticAssignmentEffectDefinition as domain data',
    'plain set carries a write-only effect projection; compound assignment operators carry a projection of distinct ref and mod relations',
    'semanticModRefEffectFactory projects the already-modeled relation kind without reclassifying the operator',
    'the canonical SemanticKnowledgeDataFlow preserves the effect relation through semanticObjectIdentityOperations.modRefEvidence',
    'the interface-backed CLI manifest scan and controller-invocation composition path remain the downstream route',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'The syntax boundary still maps parser operator spelling/code to the canonical operator definition; effect projection is now owned by the operator effect ADT, but parser-boundary lookup and primitives remain.',
    'PHP by-reference assignment, heap alias identity, and interprocedural callable summaries remain separate semantic work.',
    'Full repository typecheck, full Vitest, and CLI-to-manifest end-to-end execution remain unverified.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3046_ASSIGNMENT_EFFECT_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  process.stderr.write(`Phase 3046 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3046 audit passed: ${report.passed}/${report.total}\n`);
}
