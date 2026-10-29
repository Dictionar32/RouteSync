const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const knowledge = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const effects = read('packages/core/src/types/upstream/semanticModRefFactOperations.ts');
const expressions = read('packages/core/src/compiler/frontend/php/routeAst/phpAstExpressionSyntaxEvidenceRegistry.ts');
const statements = read('packages/core/src/compiler/frontend/php/routeAst/phpAstStatementSyntaxEvidenceRegistry.ts');
const focusedTest = read('packages/core/src/types/upstream/__tests__/semanticAssignmentEffectDomainOperations.phase3046.test.ts');
const regressionTest = read('packages/core/src/types/upstream/__tests__/semanticModRefDomainOperations.phase3045.test.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const deletedFoundations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  effectOperationAcceptsCanonicalAssignment: /readonly assignmentEffects: \(assignment: SemanticAssignment\) => readonly SemanticModRefRelation\[\]/.test(effects),
  effectProjectsIdentityTargetKindAndProvenanceFromOneObject: /assignmentEffects: \(assignment: SemanticAssignment\): readonly SemanticModRefRelation\[\] => assignment.operator.effect.projection.project\(assignment\)/.test(effects),
  expressionProducerCreatesOneCanonicalAssignmentObject: /const assignment = \{ id: base, target, value: valueId, operator: semanticAssignmentOperator\(value\.operator\.kind\), reference: semanticAssignmentReference\(value\.reference\.kind\), source \};\s*const id = add\(\{ kind: 'assignment', value: assignment \}\);\s*recordModRefRelations\(semanticModRefEffectFactory\.assignmentEffects\(assignment\)\)/.test(expressions),
  statementProducerCreatesOneCanonicalAssignmentObject: /const assignment = \{ id: base, target, value: valueId, operator: semanticAssignmentOperator\(value\.operator\.kind\), reference: semanticAssignmentReference\(value\.reference\.kind\), source: assignmentSource \};\s*const id = add\(\{ kind: 'assignment', value: assignment \}\);\s*recordModRefRelations\(semanticModRefEffectFactory\.assignmentEffects\(assignment\)\)/.test(statements),
  noSeparateAssignmentTargetEffectArgumentsRemain: !/assignmentWrite\s*\(/.test(effects + expressions + statements + focusedTest + regressionTest),
  plainAndCompoundEffectsRemainExplicit: /code: 'write'/.test(knowledge) && /code: 'read-write'/.test(knowledge) && /directWrite\.kind !== 'mod'/.test(focusedTest) && /compoundRead\.kind !== 'ref'/.test(focusedTest) && /compoundWrite\.kind !== 'mod'/.test(focusedTest),
  effectRetainsExactAssignmentAndTargetIdentity: /assignment identity/.test(focusedTest) && /location\.identity\.slot\.value !== 'counter'/.test(focusedTest),
  previousModRefRegressionUsesDomainOperation: /semanticModRefEffectFactory\.assignmentEffects\(directAssignment\)/.test(regressionTest) && /compoundEffects/.test(regressionTest),
  cliManifestRuntimeStillUsesExplicitInterfaces: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli) && /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  deletedRelationFoundationsRemainAbsent: deletedFoundations.every(relative => !exists(relative)),
  collectionsInvariantPreserved: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3047,
  title: 'Assignment Fact Domain Continuation — Derive Effects from One Canonical Assignment',
  runtimeTrace: [
    'PHP AST assignment expression/statement enters the syntax evidence producer',
    'the producer resolves one canonical assignment operator and constructs one SemanticAssignment value',
    'the exact SemanticAssignment value is emitted as the canonical assignment fact',
    'semanticModRefEffectFactory.assignmentEffects delegates to the effect projection owned by the same SemanticAssignment operator definition',
    'SemanticKnowledgeDataFlow preserves the resulting mod/ref relation for semanticObjectIdentityOperations.modRefEvidence',
    'the integrated semantic response continues through the interface-backed CLI manifest scan and controller-invocation composition path',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'Parser-boundary assignment operator resolution still maps a closed syntax operator code to its canonical semantic definition; this phase removes duplicate resolution and mismatched effect arguments, not every boundary mapping.',
    'Compound assignment now emits separate ref and mod relations; PHP by-reference aliasing, heap locations, evaluation-order fidelity, and callable summaries remain to be modeled.',
    'Full repository typecheck, full Vitest, and end-to-end CLI-to-manifest execution remain unverified.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3047_ASSIGNMENT_FACT_DOMAIN_CONTINUATION_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  process.stderr.write(`Phase 3047 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3047 audit passed: ${report.passed}/${report.total}\n`);
}
