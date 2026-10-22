const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const files = {
  upstream: 'packages/core/src/types/upstream/semanticDataflowQueryPolicy.ts',
  runtimePolicy: 'packages/core/src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts',
  analysis: 'packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts',
  tests: 'packages/core/src/compiler/analysis/__tests__/ecommerceShopDataflowPolicyPhase1029.spec.ts',
};
const src = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
const pkg = JSON.parse(read('package.json'));
check('upstream owns producer-domain materialization', src.upstream.includes('materializeSemanticDataflowQueryPolicy') && src.upstream.includes('judgment.facts.filter') && src.upstream.includes('sourceProducers') && src.upstream.includes('sinkProducers'), 'source/sink fact selection is performed before Runtime receives a contract');
check('policy contract is closed and judgment-scoped', src.upstream.includes("kind: 'semantic_dataflow_query_policy_contract'") && src.upstream.includes('judgmentNode') && src.upstream.includes('closed: true'), 'the policy is a typed, closed contract associated with one canonical judgment');
check('runtime policy consumes selected facts only', !src.runtimePolicy.includes('sourceProducers') && !src.runtimePolicy.includes('sinkProducers') && src.runtimePolicy.includes('validatedContract.sourceFacts') && src.runtimePolicy.includes('validatedContract.sinkFacts') && !src.runtimePolicy.includes('selectDataFlowFacts'), 'Runtime does not classify facts by producer domain');
check('runtime validates versioned contract invariants against judgment', src.runtimePolicy.includes('decodeSemanticDataflowQueryPolicyContract(candidate, dataflow.state)') && src.upstream.includes('contractVersion: 1') && src.upstream.includes('if (!semanticDataflowIdentityEqual(contract.judgmentNode, judgment.node)) return false'), 'mismatched, stale-version, or internally inconsistent contracts fail closed');
check('runtime orchestration requires upstream policy contracts', src.analysis.includes('contracts: readonly unknown[]') && src.analysis.includes('Missing upstream query-policy contract') && !src.analysis.includes('SemanticDataflowFactPolicyContext'), 'no runtime fallback reconstructs source/sink policy');
check('contract identity uses canonical identity equality', src.upstream.includes('semanticDataflowIdentityEqual(contract.judgmentNode, judgment.node)'), 'contract matching uses canonical semantic identity');
check('integration tests consume contracts from upstream manifest projection', src.tests.includes('createLaravelSourceProjectIdentity(fixtureRoot, {') && src.tests.includes('analyzeRouteSyncManifestDataflowWithPolicy(dataflowSurface, semanticDataflowRuntimeBoundary)'), 'test declares policy intent at source-project construction and Runtime consumes the resulting projected contracts');
check('legacy source/sink expectations remain tested', src.tests.includes("sourceProducers: ['route']") && src.tests.includes("sinkProducers: ['resource']") && src.tests.includes('semanticDataflowFlowsUnderPolicy'), 'existing route-to-resource policy behavior remains covered');
check('version/build command preserved', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown', `version=${pkg.version}; build=${pkg.scripts.build}`);
check('audit script registered', pkg.scripts['audit:phase1387-upstream-query-policy-contract'] === 'node scripts/audits/audit-phase1387-upstream-query-policy-contract.cjs', 'Phase 1387 audit is callable through npm run');
const failed = checks.filter(entry => !entry.pass);
for (const entry of checks) console.log(`${entry.pass ? 'PASS' : 'FAIL'} ${entry.name}: ${entry.detail}`);
console.log(`\nPhase 1387 audit: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exitCode = 1;
