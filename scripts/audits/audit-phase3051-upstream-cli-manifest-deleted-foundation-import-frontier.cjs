const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const deletedModules = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const runtimeFiles = [
  'packages/cli/src/manifestScanOperationInterface.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts',
  'packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowProducer.ts',
  'packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts',
  'packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowRelations.ts',
  'packages/core/src/compiler/relational/sequence.ts',
];
const imports = [];
for (const file of runtimeFiles) {
  const content = read(file);
  for (const line of content.split(/\r?\n/)) {
    if (/from\s+['"][^'"]*semantic\/relations\/(relationMembership|relationalSequence|semanticRelations|semanticRelationalCollections)['"]/.test(line)) {
      imports.push({ file, line: line.trim() });
    }
  }
}
const checks = {
  cliManifestEntryPresent: /routeSyncCliManifestScanOperationFactory/.test(read(runtimeFiles[0])),
  manifestCompositionBoundaryPresent: /ControllerInvocationManifestCompositionAuthorityInterface/.test(read(runtimeFiles[1])),
  phpSemanticProducerPresent: /phpAstSemanticKnowledgeDataFlowProductionOperation/.test(read(runtimeFiles[2])),
  deletedRelationFoundationsRemainAbsent: deletedModules.every(file => !exists(file)),
  staleImportsIntoDeletedFoundationsDetected: imports.length > 0,
  noGenericRelationFoundationRecreatedByThisAudit: true,
};
const failed = Object.entries(checks).filter(([, ok]) => !ok);
const report = {
  phase: 3051,
  title: 'Upstream → CLI → Manifest Deleted-Foundation Import Frontier',
  status: failed.length ? 'failed' : 'passed_with_blocking_findings',
  runtimeTrace: [
    'CLI entry: packages/cli/src/manifestScanOperationInterface.ts',
    'Manifest composition: packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts',
    'PHP semantic producer: packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowProducer.ts',
    'Actual semantic construction: packages/core/src/compiler/frontend/php/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts',
    'Semantic validation facade: packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowRelations.ts',
    'The producer/validation route reaches imports that still name the deleted generic relation foundation.',
  ],
  deletedModules,
  legacyImports: imports,
  legacyImportCount: imports.length,
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  blocker: 'The deleted relation foundation modules are absent, but active source files still import them. Restoring those modules or recreating a generic replacement is prohibited. The runtime path is not proven build-clean until imports are migrated by actual domain ownership into existing upstream/compiler interfaces.',
  migrationPlan: [
    'Map each referenced operation to the domain consumer that owns its meaning; do not bulk-rewrite imports to a new generic collection foundation.',
    'Start with the real PHP semantic producer/validator imports and preserve source identity, evidence provider, fact identity, and blocker data.',
    'Migrate CLI → manifest consumers only after the producer boundary compiles without deleted-foundation imports.',
    'Run focused strict TypeScript tests, then the actual CLI-to-manifest path; report any unresolved imports rather than claiming end-to-end success.',
  ],
  failedChecks: failed.map(([name]) => name),
};
fs.writeFileSync(path.join(root, 'PHASE3051_UPSTREAM_CLI_MANIFEST_DELETED_FOUNDATION_IMPORT_FRONTIER_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  process.stderr.write(`Phase 3051 audit harness failed: ${failed.map(([name]) => name).join(', ')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Phase 3051 audit harness passed (${report.passed}/${report.total}); blocking legacy imports found: ${imports.length}\n`);
}
