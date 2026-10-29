const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const filesUnder = (relative) => {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(relative, entry.name);
    return entry.isDirectory() ? filesUnder(child) : [child];
  });
};

const dtoScanner = read('packages/core/src/compiler/scanner/operations/dtoAstCanonical.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts');
const cliFactory = read('packages/cli/src/manifestScanOperationInterface.ts');
const upstreamComposition = read('packages/cli/src/upstreamCompositionFactory.ts');
const scanCommand = read('packages/cli/src/commands/scan.ts');
const syncCommand = read('packages/cli/src/commands/sync.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const testFiles = [
  'packages/core/src/types/upstream/__tests__/laravel-dto-response-contract-projection-authority.phase2190.test.ts',
  'packages/core/src/types/upstream/__tests__/laravel-dto-declaration-resolution-authority.phase2180.test.ts',
  'packages/core/src/types/upstream/__tests__/laravel-dto-type-reference-binding.phase2187.test.ts',
];
const relationsFiles = filesUnder('packages/core/src/semantic/relations');
const foundationFiles = filesUnder('packages/core/src/semantic/foundation');
const coreTsFiles = filesUnder('packages/core/src').filter((file) => file.endsWith('.ts'));
const relationFoundationReferences = coreTsFiles.reduce((count, file) => count + (read(file).match(/relationFoundation/g) || []).length, 0);
const tests = testFiles.map(read);

const checks = [
  ['relations directory exists and remains empty', fs.existsSync(path.join(root, 'packages/core/src/semantic/relations')) && relationsFiles.length === 0],
  ['foundation directory exists and remains empty', fs.existsSync(path.join(root, 'packages/core/src/semantic/foundation')) && foundationFiles.length === 0],
  ['DTO AST and inventory entrypoints are not exported as free functions', !/export\s+async\s+function\s+scanDto(?:Asts|DeclarationInventory)\b/.test(dtoScanner)],
  ['DTO AST projection implementation is internal and preserves incomplete-inventory failure', /const scanDtoAstsImplementation = async/.test(dtoScanner) && /inventory\.kind === 'laravel_project_dto_declaration_inventory_incomplete'/.test(dtoScanner)],
  ['DTO inventory implementation is internal', /const scanDtoDeclarationInventoryImplementation = async/.test(dtoScanner)],
  ['DTO runtime operation interface explicitly types AST and inventory scans', /export interface DtoDeclarationInventoryScanningOperationInterface\s*\{\s*readonly scanAsts: \(sourceProject: SourceProjectIdentity\) => Promise<readonly DtoAst\[\]>;\s*readonly scanInventory: \(sourceProject: SourceProjectIdentity\) => Promise<LaravelProjectDtoDeclarationInventoryInterface>;\s*\}/s.test(dtoScanner)],
  ['DTO runtime operation is interface-first and frozen', /export const dtoDeclarationInventoryScanningOperation: DtoDeclarationInventoryScanningOperationInterface = Object\.freeze\(\{\s*scanAsts: scanDtoAstsImplementation,\s*scanInventory: scanDtoDeclarationInventoryImplementation,\s*\}\)/s.test(dtoScanner)],
  ['production source pipeline consumes the DTO inventory operation', /import \{ dtoDeclarationInventoryScanningOperation \}/.test(wiring) && /scan: dtoDeclarationInventoryScanningOperation\.scanInventory/.test(wiring)],
  ['DTO authority tests call the operation rather than the removed free function', tests.every((source) => /dtoDeclarationInventoryScanningOperation\.scanInventory\(sourceProject\)/.test(source))],
  ['CLI scan and sync retain the shared manifest runtime operation', /manifestScanOperation\.scan\(/.test(scanCommand) && /manifestScanOperation\.scan\(/.test(syncCommand)],
  ['upstream composition still constructs the manifest scan operation', /export interface RouteSyncCliManifestScanOperationInterface/.test(cliFactory) && /routeSyncCliManifestScanOperationFactory/.test(upstreamComposition)],
  ['manifest builder preserves complete and blocked ADT outcomes', /kind:\s*'manifest_builder_complete'/.test(manifestBuilder) && /kind:\s*'manifest_builder_blocked'/.test(manifestBuilder)],
  ['no relationFoundation references remain in core source', relationFoundationReferences === 0],
];

const result = {
  phase: 2737,
  title: 'DTO AST Runtime Operation and Upstream CLI Manifest Trace',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  relationFoundationReferencesInCoreSource: relationFoundationReferences,
  relationDirectoryFileCount: relationsFiles.length,
  foundationDirectoryFileCount: foundationFiles.length,
  scannerSubscannerTypeScriptFileCount: filesUnder('packages/core/src/compiler/scanner/operations').filter((file) => file.endsWith('.ts')).length,
  verificationScope: 'Static source audit only. This script does not claim full project typecheck, unit tests, build, or CLI end-to-end execution. The semantic/relations and semantic/foundation directories are intentionally empty and are not recreated or repaired.',
};

const reportPath = path.join(root, 'reports/PHASE2737_DTO_AST_RUNTIME_OPERATION_AUDIT.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
for (const check of result.checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
console.log(`RESULT ${result.passed}/${result.total}`);
console.log(`REPORT ${path.relative(root, reportPath)}`);
if (result.passed !== result.total) process.exitCode = 1;
