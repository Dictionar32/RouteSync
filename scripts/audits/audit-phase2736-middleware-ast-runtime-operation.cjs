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

const middleware = read('packages/core/src/compiler/scanner/operations/middlewareAstCanonical.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts');
const cliFactory = read('packages/cli/src/manifestScanOperationInterface.ts');
const upstreamComposition = read('packages/cli/src/upstreamCompositionFactory.ts');
const scanCommand = read('packages/cli/src/commands/scan.ts');
const syncCommand = read('packages/cli/src/commands/sync.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const relationsFiles = filesUnder('packages/core/src/semantic/relations');
const foundationFiles = filesUnder('packages/core/src/semantic/foundation');
const coreTsFiles = filesUnder('packages/core/src').filter((file) => file.endsWith('.ts'));
const relationFoundationReferences = coreTsFiles.reduce((count, file) => count + (read(file).match(/relationFoundation/g) || []).length, 0);

const checks = [
  ['relations directory exists and remains empty', fs.existsSync(path.join(root, 'packages/core/src/semantic/relations')) && relationsFiles.length === 0],
  ['foundation directory exists and remains empty', fs.existsSync(path.join(root, 'packages/core/src/semantic/foundation')) && foundationFiles.length === 0],
  ['middleware AST scan is not exported as a free function', !/export\s+async\s+function\s+scanMiddlewareAsts\b/.test(middleware)],
  ['middleware AST scan implementation is internal', /const scanMiddlewareAstsImplementation = async \(sourceProject: SourceProjectIdentity\)/.test(middleware)],
  ['middleware scan interface explicitly types input and output', /export interface MiddlewareAstScanningOperationInterface\s*\{\s*readonly scan: \(sourceProject: SourceProjectIdentity\) => Promise<readonly MiddlewareAst\[\]>;\s*\}/s.test(middleware)],
  ['middleware scan operation is interface-first and frozen', /export const middlewareAstScanningOperation: MiddlewareAstScanningOperationInterface = Object\.freeze\(\{\s*scan: scanMiddlewareAstsImplementation,\s*\}\)/s.test(middleware)],
  ['production source pipeline consumes operation.scan', /import \{ middlewareAstScanningOperation \}/.test(wiring) && /asts: await middlewareAstScanningOperation\.scan\(sourceProject\)/.test(wiring)],
  ['CLI manifest scan operation remains explicit', /export interface RouteSyncCliManifestScanOperationInterface/.test(cliFactory) && /routeSyncCliManifestScanOperationFactory/.test(upstreamComposition)],
  ['scan command uses the shared manifest runtime operation', /manifestScanOperation\.scan\(/.test(scanCommand)],
  ['sync command uses the shared manifest runtime operation', /manifestScanOperation\.scan\(/.test(syncCommand)],
  ['manifest builder preserves complete and blocked ADT outcomes', /kind:\s*'manifest_builder_complete'/.test(manifestBuilder) && /kind:\s*'manifest_builder_blocked'/.test(manifestBuilder)],
  ['no relationFoundation references remain in core source', relationFoundationReferences === 0],
];

const result = {
  phase: 2736,
  title: 'Middleware AST Runtime Operation and Upstream CLI Manifest Trace',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  relationFoundationReferencesInCoreSource: relationFoundationReferences,
  relationDirectoryFileCount: relationsFiles.length,
  foundationDirectoryFileCount: foundationFiles.length,
  scannerSubscannerTypeScriptFileCount: filesUnder('packages/core/src/compiler/scanner/operations').filter((file) => file.endsWith('.ts')).length,
  verificationScope: 'Static source audit only; this script does not claim full project typecheck, unit tests, build, or CLI end-to-end execution. Imports into intentionally empty relations/foundation directories are not repaired or hidden.',
};

const reportPath = path.join(root, 'reports/PHASE2736_MIDDLEWARE_AST_RUNTIME_OPERATION_AUDIT.json');
fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
for (const check of result.checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
console.log(`RESULT ${result.passed}/${result.total}`);
console.log(`REPORT ${path.relative(root, reportPath)}`);
if (result.passed !== result.total) process.exitCode = 1;
