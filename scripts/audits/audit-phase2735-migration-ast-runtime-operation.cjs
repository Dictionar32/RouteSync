const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const filesUnder = (directory) => {
  const absolute = path.join(root, directory);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(relative) : [relative];
  });
};

const migration = read('packages/core/src/compiler/scanner/operations/migrationAstCanonical.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts');
const cliFactory = read('packages/cli/src/manifestScanOperationInterface.ts');
const upstreamComposition = read('packages/cli/src/upstreamCompositionFactory.ts');
const scanCommand = read('packages/cli/src/commands/scan.ts');
const syncCommand = read('packages/cli/src/commands/sync.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const relationsFiles = filesUnder('packages/core/src/semantic/relations');
const foundationFiles = filesUnder('packages/core/src/semantic/foundation');

const checks = [
  ['relations directory exists and is empty', fs.existsSync(path.join(root, 'packages/core/src/semantic/relations')) && relationsFiles.length === 0],
  ['foundation directory exists and is empty', fs.existsSync(path.join(root, 'packages/core/src/semantic/foundation')) && foundationFiles.length === 0],
  ['migration scan function is not exported', !/export\s+async\s+function\s+scanMigrationAsts\b/.test(migration)],
  ['migration scan has an explicit operation interface', /export interface MigrationAstScanningOperationInterface\s*\{[\s\S]*readonly scan: \(sourceProject: SourceProjectIdentity\) => Promise<readonly MigrationAst\[\]>/.test(migration)],
  ['migration runtime operation is interface-first and frozen', /export const migrationAstScanningOperation:\s*MigrationAstScanningOperationInterface\s*=\s*Object\.freeze\(\{\s*scan:\s*scanMigrationAstsImplementation/s.test(migration)],
  ['production source pipeline consumes operation.scan', /import \{ migrationAstScanningOperation \}/.test(wiring) && /scan:\s*migrationAstScanningOperation\.scan/.test(wiring)],
  ['CLI manifest scan contract is an explicit interface-first operation', /export interface RouteSyncCliManifestScanOperationInterface/.test(cliFactory) && /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface = Object\.freeze/.test(cliFactory)],
  ['CLI upstream composition builds the canonical manifest scan operation', /routeSyncCliManifestScanOperationFactory\.create\(manifestComposition\)/.test(upstreamComposition)],
  ['scan command consumes manifestScanOperation.scan', /manifestScanOperation\.scan\(/.test(scanCommand)],
  ['sync command consumes manifestScanOperation.scan', /manifestScanOperation\.scan\(/.test(syncCommand)],
  ['manifest builder preserves complete and blocked judgments', /kind:\s*'manifest_builder_complete'/.test(manifestBuilder) && /kind:\s*'manifest_builder_blocked'/.test(manifestBuilder)],
];

const result = {
  phase: 2735,
  title: 'Migration AST Runtime Operation and Upstream CLI Manifest Trace',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  relationFoundationReferencesInCoreSource: (() => {
    const scan = (directory) => fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
      const relative = path.join(directory, entry.name);
      return entry.isDirectory() ? scan(relative) : relative.endsWith('.ts') ? [relative] : [];
    });
    return scan('packages/core/src').reduce((count, file) => count + (fs.readFileSync(path.join(root, file), 'utf8').match(/relationFoundation/g) || []).length, 0);
  })(),
  relationDirectoryFileCount: relationsFiles.length,
  foundationDirectoryFileCount: foundationFiles.length,
  verificationScope: 'Static source audit only; this script does not claim full project typecheck, unit tests, build, or CLI end-to-end execution.',
};

const reportPath = path.join(root, 'reports/PHASE2735_MIGRATION_AST_RUNTIME_OPERATION_AUDIT.json');
fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
for (const check of result.checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
console.log(`RESULT ${result.passed}/${result.total}`);
console.log(`REPORT ${path.relative(root, reportPath)}`);
if (result.passed !== result.total) process.exitCode = 1;
