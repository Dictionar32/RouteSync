const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const lowerer = read('packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts');
const composition = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts');
const integrated = read('packages/core/src/compiler/scanner/wiring/integratedRouteManifestAuthority.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const pipelineContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const checks = [
  ['no duplicate lowerer interface was added', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestLowererInterface.ts')) && !/RouteManifestLowererInterface/.test(lowerer + read('packages/core/src/index.ts'))],
  ['existing RouteManifestProjectionCompositionInterface remains the composition contract', /interface RouteManifestProjectionCompositionInterface/.test(composition) && /RouteManifestProjectionCompositionInterface/.test(composition)],
  ['integrated authority delegates through existing composition', /createRouteManifestProjectionComposition\(pipeline\)/.test(integrated) && /composition\.project\(manifest, baseURL, version\)/.test(integrated) && !/routeManifestLowerer|lowerRouteSyncManifestToRouteManifest/.test(integrated)],
  ['lowerer has no semantic relations dependency', !/semantic\/relations/.test(lowerer)],
  ['lowerer has no semantic foundation dependency', !/semantic\/foundation/.test(lowerer)],
  ['existing source-AST dependency interface remains authoritative', /LaravelSourceAstPipelineDependenciesInterface/.test(pipeline) && /interface LaravelSourceAstPipelineDependenciesInterface/.test(pipelineContract)],
  ['scanner retirement debt remains visible instead of being hidden by an adapter', /ChannelScanner\.scanCanonicalAsts/.test(pipeline) && /LaravelChannelScannerInterface/.test(read('packages/core/src/types/upstream/laravelChannelScannerInterface.ts'))],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} assertions passed\n`);
process.exitCode = failed.length === 0 ? 0 : 1;
