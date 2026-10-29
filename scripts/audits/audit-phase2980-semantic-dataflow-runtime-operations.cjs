const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const walk = (relative) => {
  const base = path.join(root, relative);
  if (!fs.existsSync(base)) return [];
  return fs.readdirSync(base, { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) return walk(next);
    return entry.isFile() && next.endsWith('.ts') ? [next] : [];
  });
};
const paths = [
  ...walk('packages/core/src/types/upstream'),
  ...walk('packages/cli/src'),
  ...walk('packages/core/src/graph'),
  ...walk('packages/core/src/compiler/ir'),
];
const uniquePaths = [...new Set(paths)];
const sources = uniquePaths.map((file) => ({ file, text: read(file) }));
const semantic = read('packages/core/src/types/upstream/semanticDataflow.ts');
const interfaceSurface = read('packages/core/src/types/upstream/semanticDataflowInterface.ts');
const coreIndex = read('packages/core/src/index.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const audit = {
  phase: 2980,
  title: 'Fully Explicit Simplicity — Semantic Dataflow Runtime Operations',
  scope: [
    'semantic dataflow identity key/equality runtime operations',
    'fact lineage attachment operation',
    'upstream producer and downstream IR consumer cutover',
    'upstream → CLI → manifest → IR trace and export backlog inventory',
  ],
  checks: [
    { name: 'identity key/equality are owned by an interface-typed runtime object', passed: /export const semanticDataflowIdentityOperations:\s*SemanticDataflowIdentityOperationsInterface\s*=\s*Object\.freeze\(/.test(semantic) },
    { name: 'lineage attachment is owned by an interface-typed runtime object', passed: /export const semanticDataflowFactLineageOperations:\s*SemanticDataflowFactLineageOperationsInterface\s*=\s*Object\.freeze\(/.test(semantic) },
    { name: 'old standalone identity exports are retired', passed: !/export const semanticDataflowIdentity(Key|Equal)\s*=/.test(semantic) },
    { name: 'old standalone lineage factory export is retired', passed: !/export const semanticDataflowFactWithLineage\s*=/.test(semantic) },
    { name: 'upstream projection consumers call the domain lineage operation', passed: /semanticDataflowFactLineageOperations\.withLineage\(/.test(read('packages/core/src/types/upstream/semanticDataflowRequestProjection.ts')) && /semanticDataflowFactLineageOperations\.withLineage\(/.test(read('packages/core/src/types/upstream/semanticDataflowRouteProjection.ts')) },
    { name: 'identity consumers call the canonical identity operations', passed: /semanticDataflowIdentityOperations\.equal\(/.test(read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts')) && /semanticDataflowIdentityOperations\.key\(/.test(read('packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts')) },
    { name: 'public upstream surface exports runtime objects and their contracts', passed: /semanticDataflowIdentityOperations/.test(interfaceSurface) && /semanticDataflowFactLineageOperations/.test(interfaceSurface) && /SemanticDataflowIdentityOperationsInterface/.test(interfaceSurface) && /SemanticDataflowFactLineageOperationsInterface/.test(interfaceSurface) },
    { name: 'core public index exports typed runtime operations', passed: /export \{ semanticDataflowIdentityOperations, semanticDataflowFactLineageOperations, semanticDataflowInterfaceFactory \}/.test(coreIndex) },
    { name: 'no production TypeScript consumers reference retired function names', passed: !sources.some(({ file, text }) => !file.endsWith('/semanticDataflow.ts') && /\bsemanticDataflowIdentityKey\b|\bsemanticDataflowIdentityEqual\b|\bsemanticDataflowFactWithLineage\b/.test(text)) },
    { name: 'upstream collections remains empty', passed: collections.trim().length === 0 },
    { name: 'deleted relation foundation files remain absent', passed: ['relationMembership.ts','relationalSequence.ts','semanticRelations.ts'].every((name) => !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name))) },
  ],
  inventory: {
    scannedTypeScriptFiles: uniquePaths.length,
    remainingExportFunctionDeclarations: sources.reduce((sum, { text }) => sum + (text.match(/\bexport\s+(?:async\s+)?function\s+[A-Za-z_$][\w$]*/g) || []).length, 0),
    remainingExportArrowDeclarations: sources.reduce((sum, { text }) => sum + (text.match(/\bexport\s+const\s+[A-Za-z_$][\w$]*\s*=\s*(?:async\s*)?\(/g) || []).length, 0),
    directImportsFromDeletedRelationFoundationModules: sources.reduce((sum, { text }) => sum + (text.match(/from\s+['"][^'"]*semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)['"]/g) || []).length, 0),
  },
  verification: {
    focusedRuntimeTestsAdded: 'packages/core/src/types/upstream/__tests__/semanticDataflowRuntimeOperations.phase2980.test.ts',
    focusedRuntimeSmoke: '3/3 passed via transpiled semanticDataflow module',
    sourceSyntaxCheck: '16 changed TypeScript files transpiled without syntax diagnostics',
    fullWorkspaceTypecheck: 'blocked: installed global TypeScript does not support project ES2025 target; workspace dependencies/types are unavailable',
    fullTestSuite: 'not run: workspace dependencies are unavailable',
  },
};
audit.passed = audit.checks.filter((check) => check.passed).length;
audit.total = audit.checks.length;
fs.writeFileSync(path.join(root, 'PHASE2980_SEMANTIC_DATAFLOW_RUNTIME_OPERATIONS_AUDIT.json'), JSON.stringify(audit, null, 2) + '\n');
console.log(`Phase2980 audit: ${audit.passed}/${audit.total} checks passed`);
for (const check of audit.checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
console.log(JSON.stringify(audit.inventory, null, 2));
if (audit.passed !== audit.total) process.exitCode = 1;
