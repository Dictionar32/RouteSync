const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const cli = read('packages/cli/src/index.ts');
const factory = read('packages/cli/src/upstreamCompositionFactory.ts');
const manifest = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const manifestContract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const upstreamContract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const inventory = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts');
const authorityIntegrity = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAssessmentIntegrity.ts');
const barrel = read('packages/core/src/index.ts');
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });

check('composition-root-assembles-the-canonical-upstream-pipeline',
  cli.includes('createProgramFromSemanticComposition') && factory.includes('assembleRequestTypeDerivationProductionPipeline'),
  'host capability composition is assembled once at the CLI composition root through the core assembler');
check('scan-consumes-the-exact-assembled-pipeline',
  scan.includes('composition?.requestTypeDerivationPipeline') && scan.includes('createRouteManifestProjectionComposition(requestTypeDerivationPipeline).project(') && !scan.includes('requestTypeDerivationSemanticPipelineResolution') && !scan.includes('lowerRouteSyncManifestToRouteManifest('),
  'scan consumes the pipeline from the composition root and does not resolve semantic authority again');
check('sync-consumes-the-exact-assembled-pipeline',
  sync.includes('composition?.requestTypeDerivationPipeline') && sync.includes('createRouteManifestProjectionComposition(requestTypeDerivationPipeline).project(') && !sync.includes('requestTypeDerivationSemanticPipelineResolution') && !sync.includes('lowerRouteSyncManifestToRouteManifest('),
  'sync consumes the pipeline from the composition root and does not resolve semantic authority again');
check('missing-command-composition-fails-closed-before-source-work',
  scan.indexOf('requestTypeDerivationPipeline === undefined') < scan.indexOf('manifestComposition.compose') &&
  sync.indexOf('requestTypeDerivationPipeline === undefined') < sync.indexOf('manifestComposition.compose'),
  'commands stop before source composition when the already-assembled pipeline is absent');
check('manifest-authority-owns-discovery-identity-and-inventory-closure',
  manifestContract.includes('sourceProjectIdentityCanonicalization') && manifestContract.includes('sourceDiscovery') &&
  manifestContract.includes('sourceDocumentIdentityBinding') && manifestContract.includes('inventoryAuthority') &&
  manifest.includes('canonicalize-source-project-root-identity-before-discovery-and-inventory-binding') &&
  manifest.includes('close-the-total-source-to-judgment-correspondence-through-the-upstream-inventory-authority'),
  'project identity, source discovery, source-document identity, and completeness are explicit upstream-bound dependencies');
check('identity-inventory-operations-remain-owned-by-the-upstream-contract',
  upstreamContract.includes('interface RequestTypeDerivationSourceEvidenceInventoryInterface') &&
  inventory.includes("RequestTypeDerivationSourceEvidenceInventoryInterface['canonicalRouteIdentity']") &&
  inventory.includes("RequestTypeDerivationSourceEvidenceInventoryInterface['inventory']") &&
  barrel.includes('inventoryRequestTypeDerivationSourceEvidence'),
  'identity and inventory operations implement existing upstream contract members and are exported through core');
check('semantic-assessment-integrity-is-checked-at-the-real-implementation-owner',
  authorityIntegrity.includes('validateRequestTypeDerivationSemanticAssessment') &&
  !fs.existsSync(path.join(root, 'packages/core/src/types/upstream/requestTypeDerivationAssessmentIntegrityRuntime.ts')),
  'integrity validator is found under compiler semantic implementation; stale audit path is not required');
check('no-foundation-or-relation-imports-on-the-traced-path',
  !/semantic\/(foundation|relation)/.test([scan, sync, cli, factory, manifest, manifestContract, inventory, authorityIntegrity].join('\n')),
  'the traced CLI/manifest/upstream path stays independent of foundation and relation');
check('no-legacy-requesttype-fallback-in-cli-commands',
  !/requestTypeDerivationSemanticPipelineResolution|legacyRequestTypeFallback|fallbackRequestTypes/.test(scan + '\n' + sync) &&
  /createRouteManifestProjectionComposition\(requestTypeDerivationPipeline\)\.project\([\s\S]*?requestResolutionPreflight/.test(scan) &&
  /createRouteManifestProjectionComposition\(requestTypeDerivationPipeline\)\.project\([\s\S]*?requestResolutionPreflight/.test(sync) &&
  scan.includes('requestResolutionPreflight') && sync.includes('requestResolutionPreflight'),
  'projection consumes the upstream resolution preflight and does not introduce a RequestType[] fallback');

let failures = 0;
for (const result of checks) {
  process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}: ${result.detail}\n`);
  if (!result.passed) failures += 1;
}
for (const [relative, source] of [
  ['packages/cli/src/commands/scan.ts', scan],
  ['packages/cli/src/commands/sync.ts', sync],
  ['packages/cli/src/standaloneCompositionLoader.ts', read('packages/cli/src/standaloneCompositionLoader.ts')],
  ['packages/cli/src/upstreamCompositionFactory.ts', factory],
  ['packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts', manifest],
]) {
  const result = ts.transpileModule(source, {
    fileName: relative,
    compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics ?? []).filter(item => item.category === ts.DiagnosticCategory.Error);
  const passed = errors.length === 0;
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} syntax-transpilation ${relative}${passed ? '' : ` (${errors.length} diagnostics)`}\n`);
  if (!passed) failures += errors.length;
}
process.stdout.write(`\nPhase 2613: ${checks.length + 5 - failures}/${checks.length + 5} structural and syntax assertions passed.\n`);
if (failures) process.exitCode = 1;
