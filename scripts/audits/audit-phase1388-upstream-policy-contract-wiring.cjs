const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const files = {
  identity: 'packages/core/src/types/upstream/highLevelSourceModel.ts',
  factory: 'packages/core/src/types/upstream/sourceProjectIdentity.ts',
  manifestSeed: 'packages/core/src/types/upstream/semanticDataflowManifestSurface.ts',
  manifest: 'packages/core/src/types/upstream/manifest.ts',
  builder: 'packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts',
  flowProjection: 'packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts',
  runtimeProjection: 'packages/core/src/compiler/analysis/routeSyncManifestDataflowProjection.ts',
  runtimeSurface: 'packages/core/src/compiler/analysis/routeSyncManifestDataflowProjectionInterface.ts',
  runtimeAnalysis: 'packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts',
  runtimePolicy: 'packages/core/src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts',
  tests: 'packages/core/src/compiler/analysis/__tests__/ecommerceShopDataflowPolicyPhase1029.spec.ts',
  audit1387: 'scripts/audits/audit-phase1387-upstream-query-policy-contract.cjs',
};
const src = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
const pkg = JSON.parse(read('package.json'));
check('query intent is explicit project input', src.identity.includes('dataflowQueryPolicyIntent?: SemanticDataflowQueryPolicyIntent') && src.factory.includes('dataflowQueryPolicyIntent?: SemanticDataflowQueryPolicyIntent'), 'intent enters through the source-project contract; it is not inferred by Runtime');
check('upstream builder materializes closed policy contracts', src.builder.includes('materializeSemanticDataflowQueryPolicy') && src.builder.includes('sourceProject.dataflowQueryPolicyIntent') && src.builder.includes('dataflowQueryPolicyContracts'), 'policy facts are selected in the upstream manifest producer');
check('concrete manifest carries policy contracts', src.manifest.includes('dataflowQueryPolicyContracts: RouteSyncManifestFlow[\'dataflowQueryPolicyContracts\']'), 'the concrete manifest preserves the materialized contract');
check('manifest flow preserves contracts unchanged', src.flowProjection.includes('dataflowQueryPolicyContracts: manifest.dataflowQueryPolicyContracts'), 'construction-to-flow wiring forwards the exact contract array');
check('runtime-facing projection includes closed contracts', src.runtimeSurface.includes('dataflowQueryPolicyContracts: readonly unknown[]') && src.runtimeProjection.includes('dataflowQueryPolicyContracts: manifest.dataflowQueryPolicyContracts'), 'Runtime projection marks serialized/runtime payloads untrusted until decoder validation');
check('runtime defaults to upstream-projected policies', src.runtimeAnalysis.includes('contracts: readonly unknown[] = manifest.dataflowQueryPolicyContracts'), 'Runtime API does not require callers to reconstruct contracts');
check('runtime still fails closed on missing contract', src.runtimeAnalysis.includes('Missing upstream query-policy contract'), 'absence of a matching contract is an explicit error');
check('runtime policy does not classify producer domains', !src.runtimePolicy.includes('sourceProducers') && !src.runtimePolicy.includes('sinkProducers') && src.runtimePolicy.includes('validatedContract.sourceFacts') && src.runtimePolicy.includes('validatedContract.sinkFacts'), 'Runtime consumes already-selected source/sink facts');
check('integration test configures intent upstream', src.tests.includes('createLaravelSourceProjectIdentity(fixtureRoot, {') && src.tests.includes('analyzeRouteSyncManifestDataflowWithPolicy(dataflowSurface, semanticDataflowRuntimeBoundary)'), 'test follows source intent → manifest → flow → Runtime');
check('previous policy audit updated for the new wiring', src.audit1387.includes('contracts from upstream manifest projection'), 'prior audit checks the production-shaped call path');
check('package version and build command preserved', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown', `version=${pkg.version}; build=${pkg.scripts.build}`);
check('new audit is registered', pkg.scripts['audit:phase1388-upstream-policy-contract-wiring'] === 'node scripts/audits/audit-phase1388-upstream-policy-contract-wiring.cjs', 'Phase 1388 audit is callable through npm run');
const failed = checks.filter(item => !item.pass);
for (const item of checks) console.log(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}: ${item.detail}`);
console.log(`\nPhase 1388 audit: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exitCode = 1;
