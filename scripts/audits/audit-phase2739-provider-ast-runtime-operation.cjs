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
const scanner = read('packages/core/src/compiler/scanner/operations/providerAstCanonical.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipelineDependencies.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const cliFactory = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/upstreamCompositionFactory.ts');
const scanCommand = read('packages/cli/src/commands/scan.ts');
const syncCommand = read('packages/cli/src/commands/sync.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const coreTsFiles = filesUnder('packages/core/src').filter((file) => file.endsWith('.ts'));
const relationFoundationReferences = coreTsFiles.reduce((count, file) => count + (read(file).match(/relationFoundation/g) || []).length, 0);
const relationsFiles = filesUnder('packages/core/src/semantic/relations');
const foundationFiles = filesUnder('packages/core/src/semantic/foundation');
const checks = [
  ['semantic relations directory remains empty', fs.existsSync(path.join(root, 'packages/core/src/semantic/relations')) && relationsFiles.length === 0],
  ['semantic foundation directory remains empty', fs.existsSync(path.join(root, 'packages/core/src/semantic/foundation')) && foundationFiles.length === 0],
  ['provider bundle scanner is internal, not an exported free function', !/export\s+async\s+function\s+scanProviderBundle\b/.test(scanner) && /async function scanProviderBundleImplementation\(sourceProject: SourceProjectIdentity\)/.test(scanner)],
  ['provider AST scanner is internal, not an exported free function', !/export\s+async\s+function\s+scanProviderAsts\b/.test(scanner) && /async function scanProviderAstsImplementation\(sourceProject: SourceProjectIdentity\)/.test(scanner)],
  ['provider operations interface explicitly types both runtime operations', /export interface ProviderAstScanningOperationInterface/.test(scanner) && /readonly scanBundle: \(sourceProject: SourceProjectIdentity\) => Promise<ProviderScanBundle>/.test(scanner) && /readonly scanAsts: \(sourceProject: SourceProjectIdentity\) => Promise<readonly ProviderAst\[\]>/.test(scanner)],
  ['provider operation is interface-first and frozen', /export const providerAstScanningOperation: ProviderAstScanningOperationInterface = Object\.freeze\(\{/.test(scanner) && /scanBundle: scanProviderBundleImplementation/.test(scanner) && /scanAsts: scanProviderAstsImplementation/.test(scanner)],
  ['production provider dependency uses operation.scanBundle', /import \{ providerAstScanningOperation \}/.test(wiring) && /providerAstScanningOperation\.scanBundle\(sourceProject\)/.test(wiring) && !/scanProviderBundle\(/.test(wiring)],
  ['provider judgment preserves AST-definition pairing', /artifacts: Object\.freeze\(bundle\.artifacts\.map/.test(wiring) && /ast: artifact\.ast/.test(wiring) && /definition: artifact\.definition/.test(wiring)],
  ['CLI scan and sync retain shared manifest scan operation', /manifestScanOperation\.scan\(/.test(scanCommand) && /manifestScanOperation\.scan\(/.test(syncCommand)],
  ['upstream composition still creates shared manifest scan operation', /RouteSyncCliManifestScanOperationInterface/.test(cliFactory) && /routeSyncCliManifestScanOperationFactory/.test(composition)],
  ['manifest builder preserves complete and blocked ADT outcomes', /kind:\s*'manifest_builder_complete'/.test(manifestBuilder) && /kind:\s*'manifest_builder_blocked'/.test(manifestBuilder)],
  ['no relationFoundation references remain in core source', relationFoundationReferences === 0],
];
const result = {
  phase: 2739,
  title: 'Provider AST ADT Runtime Scanner Operations and Upstream CLI Manifest Trace',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.filter(([, passed]) => passed).length,
  total: checks.length,
  relationFoundationReferencesInCoreSource: relationFoundationReferences,
  relationDirectoryFileCount: relationsFiles.length,
  foundationDirectoryFileCount: foundationFiles.length,
  verificationScope: 'Static source audit only; does not claim full project typecheck, unit tests, build, or CLI end-to-end execution. Empty semantic directories are intentionally preserved without replacement abstractions.',
};
const reportPath = path.join(root, 'reports/PHASE2739_PROVIDER_AST_RUNTIME_OPERATION_AUDIT.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
for (const check of result.checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
console.log(`RESULT ${result.passed}/${result.total}`);
console.log(`REPORT ${path.relative(root, reportPath)}`);
if (result.passed !== result.total) process.exitCode = 1;
