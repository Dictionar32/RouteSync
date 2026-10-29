const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const selectionPath = 'packages/core/src/types/upstream/laravelRouteSourceSelection.ts';
const selection = read(selectionPath);
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const cliComposition = read('packages/cli/src/upstreamCompositionFactory.ts');
const manifestScanner = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const sourceAstPipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const cliScanOperation = read('packages/cli/src/manifestScanOperationInterface.ts');
const coreIndex = read('packages/core/src/index.ts');
const runtimeFiles = [cliComposition, cliScanOperation, manifestScanner, manifestBuilder, sourceAstPipeline, scanner, selection];
const runtimePath = runtimeFiles.join('\n');
const checks = [
  ['ready source observation has one explicit factory interface', /interface LaravelRouteSourceObservationReadyFactoryInterface/.test(selection) && /export const laravelRouteSourceObservationReadyFactory:\s*LaravelRouteSourceObservationReadyFactoryInterface\s*=\s*Object\.freeze\(/.test(selection)],
  ['ready ADT owns source reading and read-batch construction', /continueToRouteScan: async \(reader: PhpSourceDocumentReaderInterface[\s\S]*?reader\.read\([\s\S]*?phpSourceDocumentReadBatchFactory\.fromResults\(readResults\)/.test(selection)],
  ['default intent delegates ready construction to the canonical factory', /return laravelRouteSourceObservationReadyFactory\.create\(\{[\s\S]*sourceFiles,[\s\S]*scannableSources,[\s\S]*\}\);/.test(selection)],
  ['explicit intent delegates ready construction to the same factory', (selection.match(/laravelRouteSourceObservationReadyFactory\.create\(/g) || []).length === 2],
  ['ready-operation implementation is not duplicated in selection branches', (selection.match(/continueWithScannableSources: \(\): SourceFileInventory =>/g) || []).length === 1 && (selection.match(/phpSourceDocumentReadBatchFactory\.fromResults\(readResults\)/g) || []).length === 1],
  ['source-presence judgments remain explicit present/absent ADTs', /laravel_route_source_present/.test(selection) && /laravel_route_source_absent/.test(selection) && /readonly observe: \(sourceFile: SourceFile\) => LaravelRouteSourcePresenceJudgment/.test(selection)],
  ['explicit missing source remains blocked and preserves evidence', /explicitly_selected_route_source_file_absent/.test(selection) && /preserveMissingSourceEvidence: \(\): SourceFileInventory => missingFiles/.test(selection)],
  ['CLI upstream composition runtime export is explicitly typed', /export const routeSyncCliUpstreamCompositionFactory:\s*RouteSyncCliUpstreamCompositionFactoryInterface/.test(cliComposition)],
  ['CLI manifest scan operation runtime export is explicitly typed', /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface/.test(cliScanOperation)],
  ['manifest scanner runtime facade is explicitly typed', /export const routeSyncManifestScanner:\s*RouteSyncManifestScannerInterface/.test(manifestScanner)],
  ['manifest preparation and Laravel AST/scanner factories are explicitly typed', /export const manifestBuilderOperationPreparation:\s*ManifestBuilderOperationPreparationInterface/.test(manifestBuilder) && /export const laravelSourceAstPipelineFactory:\s*LaravelSourceAstPipelineFactoryInterface/.test(sourceAstPipeline) && /export const laravelRouteScannerFactory:\s*LaravelRouteScannerFactoryInterface/.test(scanner)],
  ['runtime trace contains no exported function declarations or inferred exported arrow factories', !/^\s*export\s+(?:async\s+)?function\s+/m.test(runtimePath) && !/^\s*export const\s+\w+\s*=\s*\(/m.test(runtimePath)],
  ['ready factory is exported through the core public entry', /export \{[^\n]*laravelRouteSourceObservationReadyFactory[^\n]*\} from '\.\/types\/upstream\/laravelRouteSourceSelection'/.test(coreIndex) && /export type \{ LaravelRouteSourceObservationReadyFactoryInterface \}/.test(coreIndex)],
  ['deleted relation foundation remains absent and kernel stubs do not re-export it', !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/relationMembership.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/relationalSequence.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/semanticRelations.ts')) && !/export \* from ['"]\.\.\/relations\/(?:relationMembership|relationalSequence)['"]/.test(read('packages/core/src/semantic/kernel/relationMembership.ts') + read('packages/core/src/semantic/kernel/relationalSequence.ts'))],
  ['upstream collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
const refs = childProcess.spawnSync('rg', ['-n', 'semantic/relations/(relationMembership|relationalSequence|semanticRelations)', 'packages', '--glob', '*.ts'], { cwd: root, encoding: 'utf8' });
const lines = refs.status === 0 ? refs.stdout.trim().split('\n').filter(Boolean) : [];
const staleFiles = new Set(lines.map(line => line.split(':')[0]));
const report = {
  phase: 2973,
  title: 'Fully Explicit Simplicity Typed Runtime Scanner Operations',
  passed: checks.filter(([, pass]) => pass).length,
  total: checks.length,
  checks: Object.fromEntries(checks.map(([label, pass]) => [label, pass])),
  knownUnresolvedMigration: {
    staleImportLines: lines.length,
    affectedFiles: staleFiles.size,
    deletedRelationFoundationRestored: false,
  },
};
fs.writeFileSync(path.join(root, 'PHASE2973_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`PHASE2973 runtime-path audit: ${report.passed}/${report.total} structural checks passed.`);
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
console.log(`KNOWN UNRESOLVED MIGRATION: ${lines.length} stale import lines across ${staleFiles.size} files still reference deleted relation-foundation modules; this phase does not restore them.`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
