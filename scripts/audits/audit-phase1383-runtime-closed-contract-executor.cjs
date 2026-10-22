const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const manifestSurface = read('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const manifestType = read('packages/core/src/types/upstream/manifest.ts');
const flowProjection = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const consumerProjection = read('packages/core/src/compiler/analysis/routeSyncManifestDataflowProjection.ts');
const runtimeBoundary = read('packages/core/src/compiler/analysis/semanticDataflowRuntimeBoundary.ts');
const runtimeComposition = read('packages/core/src/compiler/analysis/semanticDataflowRuntimeComposition.ts');
const adapter = read('packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts');
const pipeline = read('packages/core/src/compiler/analysis/semanticDataflowPipeline.ts');
const routeAnalysis = read('packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['Upstream manifest surface owns closed judgment production', /semanticDataflowReasoningAuthority\.judge\(inputs\.head\)/.test(manifestSurface) && /semanticDataflowJudgmentsFromInputs/.test(manifestSurface)],
  ['Builder computes judgments from the exact input sequence once', /const dataflowInputs = semanticDataflowInputsFromSourceModel/.test(builder) && /dataflowJudgments: semanticDataflowJudgmentsFromInputs\(dataflowInputs\)/.test(builder)],
  ['Manifest contract carries closed judgments as first-class output', /readonly dataflowJudgments: RouteSyncManifestFlow\['dataflowJudgments'\]/.test(manifestType) && /readonly dataflowJudgments: Sequence<SemanticDataflowJudgment>/.test(manifestSurface)],
  ['Validated flow transports judgments unchanged', /dataflowJudgments: manifest\.dataflowJudgments/.test(flowProjection)],
  ['Analysis surface projection transports judgments unchanged', /dataflowJudgments: manifest\.dataflowJudgments/.test(consumerProjection)],
  ['Runtime wiring accepts closed judgment, never raw input', /UpstreamWiringInterface<[\s\S]*SemanticDataflowJudgment[\s\S]*SemanticDataflowRuntimeDataFlow/.test(runtimeBoundary) && !/SemanticDataflowInput/.test(runtimeBoundary)],
  ['Runtime composition contains no semantic authority import or judge call', !/semanticDataflowReasoningAuthority|\.judge\(/.test(runtimeComposition)],
  ['Adapter is a pure projection and preserves the same judgment/proof', /judgment\.reasoningContract/.test(adapter) && /input:\s*judgment/.test(adapter) && /state:\s*judgment/.test(adapter) && !/\.judge\(|SemanticDataflowReasoningAuthorityInterface/.test(adapter)],
  ['Pipeline only projects closed judgments', /input:\s*SemanticDataflowJudgment/.test(pipeline) && /runtime\.project\(input\)/.test(pipeline) && !/SemanticDataflowInput|\.judge\(/.test(pipeline)],
  ['Route analysis looks up the upstream judgment, not an input seed', /manifest\.dataflowJudgments/.test(routeAnalysis) && /Missing upstream-closed dataflow judgment/.test(routeAnalysis) && !/manifest\.dataflowInputs/.test(routeAnalysis)],
  ['Package version and build command remain unchanged', packageJson.version === '1.0.49' && packageJson.scripts.build === 'tsdown'],
];
const failures = checks.filter(([, passed]) => !passed);
const report = {
  phase: 1383,
  audit: 'runtime-closed-contract-executor',
  passedChecks: checks.length - failures.length,
  totalChecks: checks.length,
  checks: checks.map(([name, passed]) => ({ name, passed })),
  architecture: {
    upstream: 'input seeds -> semantic authority -> closed judgments + derivation evidence',
    wiring: 'manifest/flow projections transport judgments without recomputation',
    runtime: 'closed judgment -> read-only DataFlowAuthorityInterface projection',
    prohibitedRuntimeResponsibilities: ['seed classification', 'judgment construction', 'fixed-point closure', 'proof synthesis'],
  },
  limitations: ['Static source-contract audit only; TypeScript build and runtime tests must be executed in an environment with dependencies available.'],
};
const reportPath = path.join(root, 'scripts/audits/reports/phase1383-runtime-closed-contract-executor.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ audit: report.audit, passed: failures.length === 0, passedChecks: report.passedChecks, totalChecks: report.totalChecks, failures: failures.map(([name]) => name), report: path.relative(root, reportPath) }, null, 2));
process.exitCode = failures.length ? 1 : 0;
