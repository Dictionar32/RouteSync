const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checkResults = [];
const check = (name, passed, evidence) => checkResults.push({ name, passed: Boolean(passed), evidence });
const scanner = read('packages/core/src/types/upstream/scannerTokenStructureAlgebra.ts');
const scannerContract = read('packages/core/src/types/upstream/scannerTokenStructureInterface.ts');
const sourceSelection = read('packages/core/src/types/upstream/laravelRouteSourceSelection.ts');
const routeScanner = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const cliComposition = read('packages/cli/src/upstreamCompositionFactory.ts');
const cliManifest = read('packages/cli/src/manifestScanOperationInterface.ts');
const manifestScanner = read('packages/core/src/types/upstream/runtimeCompositionOperations.ts');
const manifestBuilder = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const manifestGraph = read('packages/core/src/graph/service/manifestGraphCompiler.ts');
const checkExport = (source, name, contract) => new RegExp(`export const ${name}:\\s*${contract}\\s*=`).test(source);
check('scanner algebra runtime export is interface-typed', checkExport(scanner, 'scannerTokenStructureAlgebra', 'ScannerTokenStructureAlgebra'));
check('scanner consumer facade runtime export is interface-typed', checkExport(scanner, 'scannerTokenStructureInterface', 'ScannerTokenStructureInterface'));
check('scanner public outcomes are explicit discriminated ADTs', /kind: 'found'/.test(scannerContract) && /kind: 'not_found'/.test(scannerContract) && /kind: 'malformed'/.test(scannerContract) && /kind: 'complete'/.test(scannerContract) && /kind: 'partitioned'/.test(scannerContract));
check('source presence ADT owns continuation operation', /continueWith: <Result>/.test(sourceSelection) && /handlers\.onPresent\(sourceFile\)/.test(sourceSelection) && /handlers\.onAbsent\(sourceFile\)/.test(sourceSelection));
check('route scan outcomes own source-AST continuation', /continueToSourceAstProjection/.test(routeScanner));
check('CLI composition factory uses explicit runtime interface', checkExport(cliComposition, 'routeSyncCliUpstreamCompositionFactory', 'RouteSyncCliUpstreamCompositionFactoryInterface'));
check('CLI composition rejection/acceptance is domain-dispatched', /assembly\.continueWith\(/.test(cliComposition) && /continueForCliComposition/.test(cliComposition));
check('CLI manifest scan factory is interface-typed', checkExport(cliManifest, 'routeSyncCliManifestScanOperationFactory', 'RouteSyncCliManifestScanOperationFactoryInterface'));
check('manifest preparation is interface-typed', checkExport(manifestScanner, 'manifestBuilderOperationPreparation', 'ManifestBuilderOperationPreparationInterface'));
check('manifest builder contract owns a typed build operation', /export interface ManifestBuilderInterface/.test(manifestBuilder) && /readonly build: \(\) => Promise<ManifestBuilderJudgment>/.test(manifestBuilder));
check('manifest builder preparation is interface-typed', checkExport(manifestScanner, 'manifestBuilderOperationPreparation', 'ManifestBuilderOperationPreparationInterface'));
check('manifest graph compiler runtime operation is interface-typed', checkExport(manifestGraph, 'manifestGraphCompilationOperations', 'ManifestGraphCompilationOperationsInterface'));
check('upstream collection foundation remains absent', fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).toString() === '\n');

const deletedRelationPattern = /from\s*['\"][^'\"]*semantic\/relations\/(relationMembership|relationalSequence|semanticRelations)['\"]/g;
const relationImports = [];
const walk = directory => {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(relative);
    else if (entry.isFile() && entry.name.endsWith('.ts')) {
      const source = read(relative);
      for (const match of source.matchAll(deletedRelationPattern)) relationImports.push({ file: relative, import: match[0] });
    }
  }
};
for (const directory of ['packages/core/src', 'packages/cli/src']) walk(directory);
const upstreamImports = relationImports.filter(item => item.file.startsWith('packages/core/src/types/upstream/'));
const cliDirectImports = relationImports.filter(item => item.file.startsWith('packages/cli/src/'));
const failed = checkResults.filter(item => !item.passed);
const result = {
  phase: 2977,
  title: 'Runtime Scanner Operations — Upstream → CLI → Manifest Trace',
  passed: checkResults.length - failed.length,
  total: checkResults.length,
  checks: checkResults,
  runtimePath: [
    'scannerTokenStructureInterface / scannerTokenStructureAlgebra',
    'Laravel route source selection and source-document read continuation',
    'Laravel route scan outcome → source AST projection',
    'request-type semantic pipeline assembly',
    'CLI upstream composition → CLI manifest scan operation',
    'manifest scan operation → manifest scanner → manifest builder',
    'manifest graph compilation operation',
  ],
  remainingDeletedRelationFoundationImports: {
    allCoreAndCli: relationImports.length,
    upstreamTypeDirectory: upstreamImports.length,
    upstreamFiles: new Set(upstreamImports.map(item => item.file)).size,
    cliDirect: cliDirectImports.length,
    note: 'These counts include imports of the three intentionally deleted modules. They are blockers to migrate by consumer domain; do not restore or recreate the deleted foundation.'
  },
  knownLimit: 'Structural/runtime-surface audit only. It does not claim full migration or a passing TypeScript build. Scanner token judgments currently expose discriminants and evidence, but unlike source-presence and route-scan outcomes, the scanner token judgments do not yet consistently own continueWith operations.',
};
fs.writeFileSync(path.join(root, 'PHASE2977_RUNTIME_SCANNER_UPSTREAM_CLI_MANIFEST_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
for (const item of checkResults) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}`);
console.log(`\n${result.passed}/${result.total} checks passed`);
console.log(`Remaining deleted-foundation imports: ${relationImports.length} total; ${upstreamImports.length} upstream; ${cliDirectImports.length} direct CLI`);
if (failed.length) process.exitCode = 1;
