const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const validatorPath = 'packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowRelations.ts';
const validator = read(validatorPath);
const forbidden = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
  'packages/core/src/semantic/relations/semanticRelationalCollections.ts',
];
const activePath = [
  'packages/cli/src/manifestScanOperationInterface.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts',
  'packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowProducer.ts',
  'packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts',
  validatorPath,
  'packages/core/src/compiler/relational/sequence.ts',
];
const remainingImports = [];
for (const file of activePath) {
  for (const line of read(file).split(/\r?\n/)) {
    if (/from\s+['"][^'"]*semantic\/relations\/(relationMembership|relationalSequence|semanticRelations|semanticRelationalCollections)['"]/.test(line)) {
      remainingImports.push({ file, line: line.trim() });
    }
  }
}
const checks = {
  validatorHasNamedInterfaceObject: /export const semanticKnowledgeDataFlowWiring:\s*SemanticKnowledgeDataFlowWiringInterface\s*=\s*Object\.freeze\(\{\s*validate\s*\}\)/s.test(validator),
  validatorNoLongerImportsDeletedRelationModules: !/semantic\/relations\/(relationMembership|relationalSequence|semanticRelations|semanticRelationalCollections)/.test(validator),
  validatorNoLongerUsesTypedRelationFacade: !/semanticTypedRelation|typedRelation|typedSelect|typedDistinct/.test(validator),
  duplicateIdentityInvariantPreserved: /Duplicate semantic knowledge identity detected/.test(validator),
  unknownFlowEndpointInvariantPreserved: /Semantic data-flow fact references unknown knowledge/.test(validator),
  guardAndDerivedRelationInvariantsPreserved: /Semantic data-flow guard references unknown predicate/.test(validator) && /Derived relation is not backed by canonical data-flow/.test(validator),
  deletedFoundationsRemainAbsent: forbidden.every(file => !exists(file)),
  collectionsInvariantPreserved: fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).length === 1 && fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'))[0] === 10,
};
const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  phase: 3052,
  title: 'Semantic Knowledge Validation Domain Operations',
  status: failed.length ? 'failed' : 'passed_with_remaining_runtime_blockers',
  migration: {
    file: validatorPath,
    summary: 'Validation no longer delegates fact identity, endpoint, guard, or derived-edge checks to the deleted relation foundation or the upstream typed-relation facade. Checks are performed at the scanner semantic-validation boundary.',
    preservedInvariants: [
      'fact identity uniqueness',
      'data-flow endpoints must reference known semantic facts',
      'data-flow facts cannot self-reference',
      'guard predicates must reference known semantic facts',
      'derived relation edges must be backed by canonical data-flow facts',
    ],
  },
  remainingRuntimeImports: remainingImports,
  remainingRuntimeImportCount: remainingImports.length,
  checks,
  passed: Object.values(checks).filter(Boolean).length,
  total: Object.keys(checks).length,
  verificationBoundary: {
    strictTypeScript: 'blocked by broader transitive imports into deleted semantic/relations modules in upstream semantic closure/rewrite/constraint files; validator source itself was not reported with a local diagnostic in the captured typecheck output',
    cliToManifestE2E: 'not run; runtime path still has deleted-foundation imports in the adapter and compiler sequence facade',
  },
  blocker: 'This phase migrates the semantic validator only. It does not claim the entire upstream → CLI → manifest path is build-clean, and does not restore or recreate a generic relation foundation.',
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3052_SEMANTIC_KNOWLEDGE_VALIDATION_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  process.stderr.write(`Phase 3052 audit failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3052 audit passed (${report.passed}/${report.total}); remaining runtime import blockers: ${remainingImports.length}\n`);
}
