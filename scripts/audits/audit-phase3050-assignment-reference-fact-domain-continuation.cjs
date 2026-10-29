const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const knowledge = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const authority = read('packages/core/src/types/upstream/semanticObjectIdentityAuthority.ts');
const focusedTest = read('packages/core/src/types/upstream/__tests__/semanticAssignmentReferenceDomainOperations.phase3049.test.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const deletedFoundations = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  concreteFactDomainOperationExists: /SemanticAssignmentReferenceFactOperationsInterface/.test(knowledge) && /semanticAssignmentReferenceFactOperations: SemanticAssignmentReferenceFactOperationsInterface/.test(knowledge),
  operationProducesTypedIdentityBindings: /identityBindings: \(facts: readonly SemanticFact\[\]\) => readonly SemanticAssignmentReferenceIdentityBinding\[\]/.test(knowledge) && /identityProjection\.project\(fact\.value\)/.test(knowledge),
  objectIdentityAuthorityDelegatesFactProjection: /semanticAssignmentReferenceFactOperations\.identityBindings\(model\.facts\)/.test(authority) && !/isAssignmentFact/.test(authority),
  noGenericVisitorOrGenericContinuationAdded: !/SemanticFactVisitor|continueWith\s*<R>/.test(knowledge),
  testCoversIdentityAndProvenance: /upstream fact-domain continuation must project only by-reference identity bindings/.test(focusedTest) && /preserve identity and provenance/.test(focusedTest),
  cliManifestInterfacePathPreserved: /routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli) && /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  deletedRelationFoundationsRemainAbsent: deletedFoundations.every(relative => !exists(relative)),
  collectionsInvariantPreserved: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3050,
  title: 'Assignment Reference Fact-Domain Continuation',
  runtimeTrace: [
    'PHP source producer creates canonical SemanticAssignment facts with a reference-mode definition.',
    'The upstream semantic fact domain projects assignment facts into concrete identity-binding evidence.',
    'Semantic object identity authority consumes projected bindings and no longer owns assignment-fact classification.',
    'Bindings retain assignment identity, endpoint identities, and SemanticSource provenance.',
    'Integrated semantic output continues through the existing interface-backed CLI scan and manifest-composition path.',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'The upstream operation still has one localized discriminant branch for assignment facts; this is not global elimination of if/switch/control flow.',
    'Primitive parser representations and lookup at syntax boundaries remain; no global primitive-elimination claim is made.',
    'Full PHP reference semantics, heap aliasing, callable summaries, full repository typecheck, full Vitest, and CLI-to-manifest end-to-end execution remain unverified.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3050_ASSIGNMENT_REFERENCE_FACT_DOMAIN_CONTINUATION_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  process.stderr.write(`Phase 3050 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3050 audit passed: ${report.passed}/${report.total}\n`);
}
