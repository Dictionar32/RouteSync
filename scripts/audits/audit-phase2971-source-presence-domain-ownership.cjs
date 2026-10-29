const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const selection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const composition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const sourceTests = read('packages/core/src/types/upstream/__tests__/laravel-route-source-selection.phase2922.test.ts');
const runtimeFiles = [selection, scanner, scannerContract, composition].join('\n');
const checks = [
  ['source presence is an explicit domain capability', /interface LaravelRouteSourcePresenceInterface/.test(selection) && /readonly observe: \(sourceFile: SourceFile\) => LaravelRouteSourcePresenceJudgment/.test(selection) && /type LaravelRouteSourcePresenceJudgment =/.test(selection)],
  ['selection intent owns missing-source classification', /observeFiles: \(selectedFiles: SourceFileInventory, presence: LaravelRouteSourcePresenceInterface\)/.test(selection)],
  ['default intent preserves optional absence as a distinct observation', /presence\.observe\(file\)\.continueWith\([\s\S]*laravel_route_source_file_absent_optional_default/.test(selection)],
  ['explicit intent derives and preserves exact missing-file evidence', /let missingFiles = sourceFileInventoryFactory\.empty\(\)[\s\S]*presence\.observe\(file\)\.continueWith\([\s\S]*missingFiles\.continueWith\([\s\S]*explicitly_selected_route_source_file_absent/.test(selection)],
  ['scanner injects filesystem observation instead of deciding source policy', /const sourcePresence: LaravelRouteSourcePresenceInterface/.test(scanner) && /observe: sourceFile => fs\.existsSync\(sourceFile\.value\.value\)/.test(scanner) && /observeSourceFiles\(\{ intent: sourceSelectionIntent, selectedFiles, presence: sourcePresence \}\)/.test(scanner)],
  ['scanner no longer computes missing inventory through a primitive filter', !/selectedFiles\.filter\(file => !fs\.existsSync/.test(scanner)],
  ['composition forwards the presence capability to the source-selection ADT', /input\.intent\.observeFiles\(input\.selectedFiles, input\.presence\)/.test(composition) && /readonly presence: LaravelRouteSourcePresenceInterface/.test(scannerContract)],
  ['ready source ADT still owns read orchestration and typed read-batch construction', /reader\.read\(\{ kind: 'php_source_document_read_input', sourceFile \}\)/.test(selection) && /phpSourceDocumentReadBatchFactory\.fromResults\(readResults\)/.test(selection)],
  ['source-selection tests exercise domain continuation rather than the retired callback shape', /continueToRouteScan\(sourceReader/.test(sourceTests) && !/judgment\.continueWith\(/.test(sourceTests)],
  ['traced route runtime files do not import deleted relation-foundation paths', !/semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)/.test(runtimeFiles)],
  ['route scanner runtime export remains explicitly interface typed', /export const laravelRouteScannerFactory:\s*LaravelRouteScannerFactoryInterface/.test(scanner)],
  ['upstream collections abstraction remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const rg = require('node:child_process').spawnSync('rg', ['-l', 'semantic/relations/(relationMembership|relationalSequence|semanticRelations)', 'packages', '--glob', '*.ts'], { cwd: root, encoding: 'utf8' });
const referencedFiles = rg.status === 0 ? rg.stdout.trim().split('\n').filter(Boolean).length : 0;
const lines = require('node:child_process').spawnSync('rg', ['-n', 'semantic/relations/(relationMembership|relationalSequence|semanticRelations)', 'packages', '--glob', '*.ts'], { cwd: root, encoding: 'utf8' });
const referenceCount = lines.status === 0 ? lines.stdout.trim().split('\n').filter(Boolean).length : 0;
console.log(`KNOWN BLOCKER deleted relation-foundation imports remain repo-wide: ${referencedFiles} files / ${referenceCount} references; no foundation was restored or re-exported by this phase.`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
