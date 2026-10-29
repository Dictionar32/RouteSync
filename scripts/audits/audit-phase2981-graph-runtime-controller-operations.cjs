const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const absent = file => !fs.existsSync(path.join(root, file));
const graphFiles = [
  'packages/core/src/graph/ServiceGraphBuilder.ts',
  'packages/core/src/graph/service/graphAssembler.ts',
  'packages/core/src/graph/service/manifestGraphCompiler.ts',
];
const sources = graphFiles.map(file => ({ file, text: read(file) }));
const audit = {
  phase: 2981,
  title: 'Fully Explicit Simplicity — Graph Controller Runtime Operations',
  checks: [
    { name: 'controller registration has a graph-domain ADT and operation contract', passed: /export interface ControllerRegistryOperationsInterface/.test(read('packages/core/src/graph/service/controllerRegistry.ts')) && /export const controllerRegistryOperations:\s*ControllerRegistryOperationsInterface\s*=\s*Object\.freeze\(/.test(read('packages/core/src/graph/service/controllerRegistry.ts')) },
    { name: 'graph builder uses controller registry instead of deleted membership foundation', passed: /ControllerRegistry = controllerRegistryOperations\.empty\(\)/.test(read('packages/core/src/graph/ServiceGraphBuilder.ts')) && !/semantic\/relations\/relationMembership/.test(read('packages/core/src/graph/ServiceGraphBuilder.ts')) },
    { name: 'manifest graph compiler delegates controller action reconciliation to domain operation', passed: /registry\.registerAction\(/.test(read('packages/core/src/graph/service/manifestGraphCompiler.ts')) && !/semantic\/relations\/relationMembership/.test(read('packages/core/src/graph/service/manifestGraphCompiler.ts')) },
    { name: 'graph assembly consumes graph-owned controller entries', passed: /controllers\.entries\.map/.test(read('packages/core/src/graph/service/graphAssembler.ts')) && !/semantic\/relations\/(?:relationMembership|relationalSequence)/.test(read('packages/core/src/graph/service/graphAssembler.ts')) },
    { name: 'runtime graph factory is an explicitly typed frozen operation object', passed: /export const serviceGraphBuilderFactory:\s*ServiceGraphBuilderFactoryInterface\s*=\s*Object\.freeze\(/.test(read('packages/core/src/graph/ServiceGraphBuilder.ts')) && !/export const createServiceGraphBuilder\s*=/.test(read('packages/core/src/graph/ServiceGraphBuilder.ts')) },
    { name: 'CLI calls typed graph factory interface', passed: /serviceGraphBuilderFactory\.createBuilder\(\)/.test(read('packages/cli/src/commands/scan.ts')) },
    { name: 'public core surface exports typed graph factory', passed: /export \{ serviceGraphBuilderFactory \}/.test(read('packages/core/src/index.ts')) && /export type \{ ServiceGraphBuilderFactoryInterface \}/.test(read('packages/core/src/index.ts')) },
    { name: 'deleted relation foundation remains absent', passed: ['relationMembership.ts','relationalSequence.ts','semanticRelations.ts'].every(name => absent(`packages/core/src/semantic/relations/${name}`)) },
    { name: 'upstream collections remains empty', passed: read('packages/core/src/types/upstream/collections.ts').trim().length === 0 },
    { name: 'graph path does not import deleted membership foundation', passed: sources.every(({text}) => !/semantic\/relations\/relationMembership/.test(text)) },
  ],
  remainingBlockers: [
    'manifestGraphCompiler still imports deleted relationalSequence for Sequence folding/projection; migrate to the existing domain-owned Sequence ADT operations without restoring the deleted module.',
    'ServiceGraphBuilder model/service Lookup contracts still depend on upstream collections.ts, which is intentionally empty; preserve that constraint and resolve the owning ADT/interface boundary rather than populating collections.ts.',
    'Other upstream, CLI, manifest and IR consumers still import deleted relation foundation modules; this phase is a bounded graph-controller migration, not a full-workspace cutover.',
    'Full build/test verification requires the project toolchain and dependency installation; no full build is claimed by this structural audit.'
  ]
};
audit.passed = audit.checks.filter(check => check.passed).length;
audit.total = audit.checks.length;
fs.writeFileSync(path.join(root, 'PHASE2981_GRAPH_RUNTIME_CONTROLLER_OPERATIONS_AUDIT.json'), JSON.stringify(audit, null, 2) + '\n');
console.log(`Phase2981 audit: ${audit.passed}/${audit.total} checks passed`);
for (const check of audit.checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
if (audit.passed !== audit.total) process.exitCode = 1;
