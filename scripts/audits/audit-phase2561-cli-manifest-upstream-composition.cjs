const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const cliIndex = read('packages/cli/src/index.ts');
const composition = read('packages/cli/src/upstreamCompositionInterface.ts');
const manifestComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const checks = [
  ['CLI upstream composition binds manifest authority and semantic pipeline', /manifestComposition:\s*ControllerInvocationManifestCompositionAuthorityInterface/.test(composition) && /requestTypeDerivationPipeline:\s*RequestTypeDerivationSemanticPipelineInterface/.test(composition)],
  ['composition is a versioned named contract', /kind:\s*'routesync_cli_upstream_composition'/.test(composition) && /contractVersion:\s*1/.test(composition)],
  ['manifest production consumes existing composition authority contract', /compose:\s*\(input:\s*ControllerInvocationManifestCompositionInput\)\s*=>\s*Promise<ControllerInvocationManifest>/.test(manifestComposition)],
  ['scan requires semantic pipeline before source identity/acquisition', /requestTypeDerivationSemanticPipelineResolution\.resolve\(composition === undefined[\s\S]*createLaravelSourceProjectIdentity/.test(scan)],
  ['sync requires semantic pipeline before source identity/acquisition', /requestTypeDerivationSemanticPipelineResolution\.resolve\(composition === undefined[\s\S]*createLaravelSourceProjectIdentity/.test(sync)],
  ['scan invokes manifest producer through injected authority', !/controllerInvocationManifestCompositionAuthority/.test(scan) && /composition\?\.manifestComposition/.test(scan) && /if \(manifestComposition === undefined\)/.test(scan) && /manifestComposition\.compose\(Object\.freeze\(/.test(scan)],
  ['sync invokes manifest producer through injected authority', !/controllerInvocationManifestCompositionAuthority/.test(sync) && /composition\?\.manifestComposition/.test(sync) && /if \(manifestComposition === undefined\)/.test(sync) && /manifestComposition\.compose\(Object\.freeze\(/.test(sync)],
  ['both CLI commands receive one shared composition object', /createScanCommand\(composition\)/.test(cliIndex) && /createSyncCommand\(composition\)/.test(cliIndex)],
  ['CLI composition root exposes the named upstream contract', /createProgram = \(composition\?: RouteSyncCliUpstreamCompositionInterface\)/.test(cliIndex) && /export type \{ RouteSyncCliUpstreamCompositionInterface \}/.test(cliIndex)],
  ['CLI does not perform semantic reasoning or legacy solver fallback', !/deriveJudgment|REQUEST_TYPE_DERIVATION_LAW_IDS|requestTypeDerivationSolver/.test(scan + sync + cliIndex)],
  ['preflight still binds canonical inventory/evidence before projection', /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(scan) && /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(sync) && /projectRouteSyncManifestForRouteManifest\([\s\S]*requestResolutionPreflight,[\s\S]*requestTypeDerivationPipeline/.test(scan)],
];
let failures = 0;
for (const [label, condition] of checks) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures += 1;
}
for (const [label, source] of [['scan', scan], ['sync', sync], ['CLI index', cliIndex], ['composition contract', composition]]) {
  const result = ts.transpileModule(source, { fileName: `${label}.ts`, compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
  const errors = (result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
  const passed = errors.length === 0;
  console.log(`${passed ? 'PASS' : 'FAIL'} syntax transpilation: ${label}`);
  if (!passed) failures += errors.length;
}
console.log(`Phase 2561: ${checks.length + 4 - failures}/${checks.length + 4} assertions passed.`);
process.exitCode = failures ? 1 : 0;
