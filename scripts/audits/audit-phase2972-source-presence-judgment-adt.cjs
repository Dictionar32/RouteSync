const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const selection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const cliComposition = read('packages/cli/src/upstreamCompositionFactory.ts');
const manifestScanner = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const sourceAstPipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const runtimePath = [cliComposition, manifestScanner, manifestBuilder, sourceAstPipeline, scanner, selection].join('\n');
const checks = [
  ['source presence is a typed ADT, not a boolean callback', /type LaravelRouteSourcePresenceJudgment\s*=/.test(selection) && /readonly observe: \(sourceFile: SourceFile\) => LaravelRouteSourcePresenceJudgment/.test(selection) && !/readonly exists: \(sourceFile: SourceFile\) => boolean/.test(selection)],
  ['presence variants own domain continuation operations', /laravel_route_source_present/.test(selection) && /laravel_route_source_absent/.test(selection) && /continueWith: <Result>\(handlers: LaravelRouteSourcePresenceHandlers<Result>\)/.test(selection)],
  ['default selection translates presence judgments into scanned or optional-absent evidence', /presence\.observe\(file\)\.continueWith\([\s\S]*onPresent:[\s\S]*laravel_route_source_file_scanned[\s\S]*onAbsent:[\s\S]*laravel_route_source_file_absent_optional_default/.test(selection)],
  ['explicit selection delegates missing-versus-ready classification to inventory ADT', /missingFiles\.continueWith\([\s\S]*onSource:[\s\S]*explicitly_selected_route_source_file_absent[\s\S]*onEmpty:/.test(selection) && !/missingFiles\.kind\s*===/.test(selection)],
  ['ready variant owns source reading and typed read-batch construction', /reader\.read\(\{ kind: 'php_source_document_read_input', sourceFile \}\)/.test(selection) && /phpSourceDocumentReadBatchFactory\.fromResults\(readResults\)/.test(selection)],
  ['scanner supplies filesystem observation as an infrastructure capability', /observe: sourceFile => fs\.existsSync\(sourceFile\.value\.value\)/.test(scanner) && /observeSourceFiles\(\{ intent: sourceSelectionIntent, selectedFiles, presence: sourcePresence \}\)/.test(scanner)],
  ['CLI composition runtime export is explicitly interface typed', /export const routeSyncCliUpstreamCompositionFactory:\s*RouteSyncCliUpstreamCompositionFactoryInterface/.test(cliComposition)],
  ['manifest scanner runtime facade is explicitly interface typed', /export const routeSyncManifestScanner:\s*RouteSyncManifestScannerInterface/.test(manifestScanner)],
  ['manifest preparation runtime export is explicitly interface typed', /export const manifestBuilderOperationPreparation:\s*ManifestBuilderOperationPreparationInterface/.test(manifestBuilder)],
  ['source AST pipeline factory is explicitly interface typed', /export const laravelSourceAstPipelineFactory:\s*LaravelSourceAstPipelineFactoryInterface/.test(sourceAstPipeline)],
  ['route scanner factory is explicitly interface typed', /export const laravelRouteScannerFactory:\s*LaravelRouteScannerFactoryInterface/.test(scanner)],
  ['runtime path has no exported function or inferred exported arrow factory', !/^export function\s+/m.test(runtimePath) && !/^export const\s+\w+\s*=\s*\(/m.test(runtimePath)],
  ['direct scanner/CLI/manifest entry files do not import deleted relation-foundation modules', !/semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)/.test(runtimePath)],
  ['deleted relation foundation remains absent and no kernel re-export points back to it', !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/relationMembership.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/relationalSequence.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/semanticRelations.ts')) && !/export \* from ['"]\.\.\/relations\/(?:relationMembership|relationalSequence)['"]/.test(read('packages/core/src/semantic/kernel/relationMembership.ts') + read('packages/core/src/semantic/kernel/relationalSequence.ts'))],
  ['upstream collections abstraction remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const refs = childProcess.spawnSync('rg', ['-n', 'semantic/relations/(relationMembership|relationalSequence|semanticRelations)', 'packages', '--glob', '*.ts'], { cwd: root, encoding: 'utf8' });
const referenceLines = refs.status === 0 ? refs.stdout.trim().split('\n').filter(Boolean).length : 0;
const referencedFiles = refs.status === 0 ? new Set(refs.stdout.trim().split('\n').map(line => line.split(':')[0])).size : 0;
const sourceRoots = ['packages/cli/src/index.ts', 'packages/core/src/index.ts', 'packages/core/src/upstream.ts'];
const visited = new Set();
const reachableStaleImports = new Set();
const importPattern = /\bfrom\s*['\"]([^'\"]+)['\"]|\bimport\s*['\"]([^'\"]+)['\"]/g;
const resolveRelative = (sourceFile, specifier) => {
  if (!specifier.startsWith('.')) return undefined;
  const candidate = path.resolve(path.dirname(sourceFile), specifier);
  for (const file of [candidate, `${candidate}.ts`, `${candidate}.tsx`, `${candidate}.js`, path.join(candidate, 'index.ts')]) {
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return `${candidate}.ts`;
};
const visit = sourceFile => {
  if (visited.has(sourceFile) || !fs.existsSync(sourceFile)) return;
  visited.add(sourceFile);
  const source = fs.readFileSync(sourceFile, 'utf8');
  if (/semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)/.test(source)) reachableStaleImports.add(sourceFile);
  for (const match of source.matchAll(importPattern)) {
    const resolved = resolveRelative(sourceFile, match[1] || match[2]);
    if (resolved && fs.existsSync(resolved)) visit(resolved);
  }
};
sourceRoots.forEach(rootFile => visit(path.resolve(root, rootFile)));
console.log(`KNOWN REPOSITORY BLOCKER: ${referenceLines} stale import lines across ${referencedFiles} files; not restored or redirected by this phase.`);
console.log(`TRANSITIVE ENTRYPOINT TRACE: visited ${visited.size} source files; ${reachableStaleImports.size} reachable files still import deleted relation-foundation modules.`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
