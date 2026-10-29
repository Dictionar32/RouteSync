const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checkResults = [];
const check = (name, passed, evidence) => checkResults.push({ name, passed: Boolean(passed), evidence });
const controlAlgebra = read('packages/core/src/types/upstream/scannerStatementControlAlgebra.ts');
const controlContract = read('packages/core/src/types/upstream/scannerStatementControlInterface.ts');
const controlRuntime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const controlFacade = read('packages/core/src/compiler/frontend/php/phpControlEvidence.ts');
const cliComposition = read('packages/cli/src/upstreamCompositionFactory.ts');
const cliManifest = read('packages/cli/src/manifestScanOperationInterface.ts');
const manifestScanner = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const checkExport = (source, name, contract) => new RegExp(`export const ${name}:\\s*${contract}\\s*=`).test(source);
check('PHP scanner control knowledge is upstream-owned', /controlKeywordIndex/.test(controlAlgebra) && /scannerStatementControlContractAlgebra/.test(controlAlgebra));
check('scanner ADT has domain continuation operations', /TokenEvidenceJudgment/.test(controlAlgebra) && /ControlKeywordJudgment/.test(controlAlgebra) && /continueWith/.test(controlAlgebra));
check('PHP AST runtime consumes upstream control algebra', /scannerStatementControlContractAlgebra\.resolve/.test(controlRuntime));
check('legacy PHP control facade no longer imports deleted relation foundation', !/semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)/.test(controlFacade));
check('legacy PHP control facade is an interface-typed runtime object', checkExport(controlFacade, 'phpControlEvidence', 'PhpControlEvidenceInterface') && /readonly resolve:/.test(controlFacade));
check('scanner output remains a closed serializable ADT', /kind: 'structured'/.test(controlContract) && /kind: 'not_structured'/.test(controlContract));
check('CLI composition is interface typed and consumes upstream assembly', checkExport(cliComposition, 'routeSyncCliUpstreamCompositionFactory', 'RouteSyncCliUpstreamCompositionFactoryInterface') && /requestTypeDerivationProductionPipelineAssembler\.assemble/.test(cliComposition));
check('CLI manifest operation factory is interface typed', checkExport(cliManifest, 'routeSyncCliManifestScanOperationFactory', 'RouteSyncCliManifestScanOperationFactoryInterface'));
check('CLI manifest scan delegates to manifest composition authority', /scan: \(input: ControllerInvocationManifestCompositionInput\): Promise<ControllerInvocationManifest> =>\s*authority\.compose\(input\)/.test(cliManifest));
check('manifest scan factory is interface typed', checkExport(manifestScanner, 'routeSyncManifestScanOperationFactory', 'RouteSyncManifestScanOperationFactoryInterface'));
check('manifest scanner runtime facade is interface typed', checkExport(manifestScanner, 'routeSyncManifestScanner', 'RouteSyncManifestScannerInterface'));
check('manifest builder preparation is interface typed and executes source AST pipeline', checkExport(manifestBuilder, 'manifestBuilderOperationPreparation', 'ManifestBuilderOperationPreparationInterface') && /sourceAstPipeline\.execute\(\)/.test(manifestBuilder));
check('manifest ADT continues into downstream flow projection', /continueToManifestBuild/.test(manifestBuilder) && /continueToFlow: \(projection\)/.test(manifestBuilder));
check('deleted generic relation foundations remain absent', !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name))));

const deletedRelationPattern = /from\s*['"][^'"]*semantic\/relations\/(relationMembership|relationalSequence|semanticRelations)['"]/g;
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
const byArea = area => relationImports.filter(item => item.file.startsWith(area));
const failed = checkResults.filter(item => !item.passed);
const result = {
  phase: 2987,
  title: 'Fully Explicit Scanner Operations — Upstream → CLI → Manifest Trace',
  passed: checkResults.length - failed.length,
  total: checkResults.length,
  checks: checkResults,
  runtimeTrace: [
    { stage: 'PHP source tokens', evidence: 'TokenDescriptor evidence enters astClassifierRuntime.ts' },
    { stage: 'Upstream scanner domain', evidence: 'scannerStatementControlContractAlgebra.resolve -> structured/not_structured judgment; private ADTs own continueWith' },
    { stage: 'CLI composition', evidence: 'routeSyncCliUpstreamCompositionFactory.compose -> requestTypeDerivationProductionPipelineAssembler.assemble' },
    { stage: 'CLI manifest operation', evidence: 'routeSyncCliManifestScanOperationFactory.create -> authority.compose(input)' },
    { stage: 'Manifest scanner', evidence: 'routeSyncManifestScanOperationFactory.create -> preparation.prepare(...).build()' },
    { stage: 'Manifest builder', evidence: 'laravelSourceAstPipeline.execute -> source model builder -> manifest judgment -> continueToFlow projection' },
  ],
  remainingDeletedRelationFoundationImports: {
    allCoreAndCli: relationImports.length,
    core: byArea('packages/core/src').length,
    upstreamTypes: byArea('packages/core/src/types/upstream/').length,
    phpFrontend: byArea('packages/core/src/compiler/frontend/php/').length,
    compilerScanner: byArea('packages/core/src/compiler/scanner/').length,
    cliDirect: byArea('packages/cli/src/').length,
    uniqueFiles: new Set(relationImports.map(item => item.file)).size,
    note: 'These are remaining imports of intentionally deleted modules, not a passing migration. Migrate consumer-owned domain boundaries; never restore the generic relation foundations.'
  },
  knownLimits: [
    'The PHP control compatibility facade has no in-repository call sites; it is now typed and relation-free, but it is not evidence that the full PHP AST runtime is relation-free.',
    'Structural trace proves the composition edges visible in source, not successful end-to-end output for every Laravel project.',
    'Full workspace typecheck/build/tests are not claimed without installed dependencies.'
  ]
};
fs.writeFileSync(path.join(root, 'PHASE2987_FULLY_EXPLICIT_SCANNER_UPSTREAM_CLI_MANIFEST_AUDIT.json'), JSON.stringify(result, null, 2) + '\n');
for (const item of checkResults) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}`);
console.log(`\n${result.passed}/${result.total} structural checks passed`);
console.log(`Remaining deleted-foundation imports: ${relationImports.length} across ${result.remainingDeletedRelationFoundationImports.uniqueFiles} files; upstream types ${result.remainingDeletedRelationFoundationImports.upstreamTypes}; PHP frontend ${result.remainingDeletedRelationFoundationImports.phpFrontend}; CLI direct ${result.remainingDeletedRelationFoundationImports.cliDirect}`);
if (failed.length) process.exitCode = 1;
