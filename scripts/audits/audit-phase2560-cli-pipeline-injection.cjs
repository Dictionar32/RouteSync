const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const cliIndex = read('packages/cli/src/index.ts');
const contract = read('packages/cli/src/upstreamCompositionInterface.ts');
const coreIndex = read('packages/core/src/index.ts');
const checks = [
  ['scan command accepts the named upstream composition', /createScanCommand = \(composition\?: RouteSyncCliUpstreamCompositionInterface\)/.test(scan)],
  ['sync command accepts the named upstream composition', /createSyncCommand = \(composition\?: RouteSyncCliUpstreamCompositionInterface\)/.test(sync)],
  ['scan resolves the injected pipeline before source acquisition', /requestTypeDerivationSemanticPipelineResolution\.resolve\(composition === undefined[\s\S]*createLaravelSourceProjectIdentity/.test(scan)],
  ['sync resolves the injected pipeline before source acquisition', /requestTypeDerivationSemanticPipelineResolution\.resolve\(composition === undefined[\s\S]*createLaravelSourceProjectIdentity/.test(sync)],
  ['CLI composition root passes the same composition to scan and sync', /createScanCommand\(composition\)/.test(cliIndex) && /createSyncCommand\(composition\)/.test(cliIndex)],
  ['CLI composition root is exported for upstream hosts', /createProgram = \(composition\?: RouteSyncCliUpstreamCompositionInterface\)/.test(cliIndex)],
  ['composition joins manifest producer and semantic pipeline', /manifestComposition:\s*ControllerInvocationManifestCompositionAuthorityInterface/.test(contract) && /requestTypeDerivationPipeline:\s*RequestTypeDerivationSemanticPipelineInterface/.test(contract)],
  ['manifest production is invoked through its authority contract', /manifestComposition\.compose\(Object\.freeze\(/.test(scan) && /manifestComposition\.compose\(Object\.freeze\(/.test(sync)],
  ['core exports the pipeline interface as a type', /export type \{ RequestTypeDerivationSemanticPipelineInterface[\s\S]*RequestTypeDerivationSemanticPipelineResolutionInterface \}/.test(coreIndex)],
  ['no CLI-local semantic reasoning is introduced', !/deriveJudgment|REQUEST_TYPE_DERIVATION_LAW_IDS|requestTypeDerivationSolver/.test(scan + sync + cliIndex)],
];
let failures = 0;
for (const [label, condition] of checks) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures += 1;
}
for (const [label, source] of [['scan', scan], ['sync', sync], ['CLI index', cliIndex], ['composition', contract]]) {
  const result = ts.transpileModule(source, { fileName: `${label}.ts`, compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
  const errors = (result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
  console.log(`${errors.length === 0 ? 'PASS' : 'FAIL'} syntax transpilation: ${label}`);
  if (errors.length) failures += errors.length;
}
console.log(`Phase 2560 updated audit: ${checks.length + 4 - failures}/${checks.length + 4} assertions passed.`);
process.exitCode = failures ? 1 : 0;
