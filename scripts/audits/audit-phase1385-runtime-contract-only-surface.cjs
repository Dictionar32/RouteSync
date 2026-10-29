const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });
const interfaceFile = 'packages/core/src/compiler/analysis/routeSyncManifestDataflowProjectionInterface.ts';
const projectionFile = 'packages/core/src/compiler/analysis/routeSyncManifestDataflowProjection.ts';
const analysisFile = 'packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts';
const runtimeFile = 'packages/core/src/compiler/analysis/semanticDataflowRuntimeComposition.ts';
const adapterFile = 'packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts';
const boundaryFile = 'packages/core/src/compiler/analysis/semanticDataflowRuntimeBoundary.ts';
const producerFile = 'packages/core/src/types/upstream/semanticDataflowManifestSurface.ts';
const legacyFile = 'packages/core/src/compiler/frontend/php/routeAst/semanticDataFlowAnalyzer.ts';
const pkg = JSON.parse(read('package.json'));
const surface = read(interfaceFile);
const projection = read(projectionFile);
const analysis = read(analysisFile);
const runtime = read(runtimeFile);
const adapter = read(adapterFile);
const boundary = read(boundaryFile);
const producer = read(producerFile);
const legacy = read(legacyFile);

const tsFiles = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) walk(relative);
    else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) tsFiles.push(relative);
  }
};
walk('packages/core/src');
const legacyImporters = tsFiles.filter((file) => file !== legacyFile &&
  !file.includes('.test.') && !file.includes('.spec.') &&
  /(?:from\s+['"][^'"]*semanticDataFlowAnalyzer['"]|import\(['"][^'"]*semanticDataFlowAnalyzer['"]\))/.test(read(file)));

check('runtime projection type excludes raw inputs', !surface.includes('ManifestDataflowSeedSurface') && !surface.includes('dataflowInputs'), 'consumer surface only exposes closed judgments and canonical controller identities');
check('projection does not forward raw inputs', projection.includes('dataflowJudgments: manifest.dataflowJudgments') && !projection.includes('dataflowInputs'), 'wiring no longer leaks raw semantic seeds downstream');
check('analysis only reads judgments', analysis.includes('manifest.dataflowJudgments') && !analysis.includes('manifest.dataflowInputs'), 'analysis consumes the precomputed upstream judgment');
check('runtime boundary is judgment-only', boundary.includes('SemanticDataflowJudgment') && !boundary.includes('SemanticDataflowInput'), 'raw semantic input cannot satisfy the runtime boundary type');
check('runtime composition has no semantic authority', !runtime.includes('semanticDataflowReasoningAuthority') && !runtime.includes('.judge('), 'composition only creates the read-only query interface');
check('adapter projects existing proof without solver', !adapter.includes('semanticDataflowReasoningAuthority') && !adapter.includes('.judge(') && !adapter.includes('close('), 'adapter only exposes closure membership as a query');
check('semantic judgment is produced upstream', producer.includes('semanticDataflowReasoningAuthority.judge(inputs.head)'), 'reasoning stays at the upstream manifest producer');
check('legacy analyzer has no production importers', legacy.includes('@deprecated Compatibility facade') && legacyImporters.length === 0, legacyImporters.length ? `unexpected production importers: ${legacyImporters.join(', ')}` : 'legacy analyzer has no production importer; references are tests only');
check('package version/build script preserved', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown', `version=${pkg.version}; build=${pkg.scripts.build}`);

const failed = checks.filter((entry) => !entry.pass);
for (const entry of checks) console.log(`${entry.pass ? 'PASS' : 'FAIL'} ${entry.name}: ${entry.detail}`);
console.log(`\nPhase 1385 audit: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exitCode = 1;
