const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const files = {
  projectionType: 'packages/core/src/compiler/analysis/routeSyncManifestDataflowProjectionInterface.ts',
  projection: 'packages/core/src/compiler/analysis/routeSyncManifestDataflowProjection.ts',
  analysis: 'packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts',
  runtimeBoundary: 'packages/core/src/compiler/analysis/semanticDataflowRuntimeBoundary.ts',
  runtimeComposition: 'packages/core/src/compiler/analysis/semanticDataflowRuntimeComposition.ts',
  adapter: 'packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts',
  pipeline: 'packages/core/src/compiler/analysis/semanticDataflowPipeline.ts',
  policy: 'packages/core/src/compiler/analysis/dataflow/semanticDataflowFactAnalysisPolicy.ts',
  producer: 'packages/core/src/types/upstream/semanticDataflowManifestSurface.ts',
  legacy: 'packages/core/src/compiler/frontend/php/routeAst/semanticDataFlowAnalyzer.ts',
};
const src = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));
const pkg = JSON.parse(read('package.json'));
const tsFiles = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) walk(relative);
    else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) tsFiles.push(relative);
  }
};
walk('packages/core/src');
const legacyImporters = tsFiles.filter((file) => file !== files.legacy && !file.includes('.test.') && !file.includes('.spec.') &&
  /(?:from\s+['"][^'"]*semanticDataFlowAnalyzer['"]|import\(['"][^'"]*semanticDataFlowAnalyzer['"]\))/.test(read(file)));

check('manifest runtime surface exposes closed judgments only', !src.projectionType.includes('ManifestDataflowSeedSurface') && !src.projectionType.includes('dataflowInputs'), 'raw semantic inputs are absent from the runtime-facing surface type');
check('wiring forwards judgments unchanged', /dataflowJudgments:\s*manifest\.dataflowJudgments/.test(src.projection) && !src.projection.includes('dataflowInputs'), 'projection passes the upstream judgment collection and does not forward raw inputs');
check('analysis matches by canonical identity and fails closed', src.analysis.includes('semanticDataflowIdentityEqual') && src.analysis.includes('Missing upstream-closed dataflow judgment') && !src.analysis.includes('dataflowInputs'), 'no raw-input fallback exists when a judgment is missing');
check('runtime boundary input and state are closed judgments', /DataFlowAuthorityInterface<\s*SemanticDataflowJudgment,\s*SemanticDataflowJudgment,\s*SemanticDataflowIdentity\s*>/.test(src.runtimeBoundary) && !src.runtimeBoundary.includes('SemanticDataflowInput'), 'runtime type excludes unjudged inputs');
check('runtime composition contains no reasoning authority', !src.runtimeComposition.includes('semanticDataflowReasoningAuthority') && !src.runtimeComposition.includes('.judge('), 'composition delegates only to the projection adapter');
check('adapter only queries precomputed closure', !src.adapter.includes('semanticDataflowReasoningAuthority') && !src.adapter.includes('.judge(') && src.adapter.includes('current.closure.some'), 'reachability reads existing closure facts');
check('pipeline preserves the judgment as its result input', src.pipeline.includes('input: SemanticDataflowJudgment') && src.pipeline.includes('runtime.project(input)'), 'pipeline wraps the existing judgment instead of building one');
check('query policy consumes the same closed judgment type', !src.policy.includes('SemanticDataflowInput') && (src.policy.match(/DataFlowAuthorityInterface<SemanticDataflowJudgment, SemanticDataflowJudgment, SemanticDataflowIdentity>/g) || []).length === 2, 'policy signatures no longer claim an unjudged input contract');
check('reasoning authority is upstream producer-owned', src.producer.includes('semanticDataflowReasoningAuthority.judge(inputs.head)'), 'judgment formation remains at the upstream manifest producer');
check('legacy analyzer has no production importers', src.legacy.includes('@deprecated Compatibility facade') && legacyImporters.length === 0, legacyImporters.length ? `unexpected production importers: ${legacyImporters.join(', ')}` : 'only test references were found');
check('version and build command preserved', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown', `version=${pkg.version}; build=${pkg.scripts.build}`);

const failed = checks.filter((entry) => !entry.pass);
for (const entry of checks) console.log(`${entry.pass ? 'PASS' : 'FAIL'} ${entry.name}: ${entry.detail}`);
console.log(`\nPhase 1386 audit: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exitCode = 1;
