const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const assert = (name, condition) => checks.push({ name, passed: Boolean(condition) });

for (const [name, relative, sourceMarker] of [
  ['scan', 'packages/cli/src/commands/scan.ts', 'const sourceProject = createLaravelSourceProjectIdentity(targetDir)'],
  ['sync', 'packages/cli/src/commands/sync.ts', 'const sourceProject = createLaravelSourceProjectIdentity(targetDir)'],
]) {
  const source = read(relative);
  const authorityMarker = 'const pipelineResolution = requestTypeDerivationSemanticPipelineResolution.resolve(composition === undefined';
  const authorityIndex = source.indexOf(authorityMarker);
  const acquisitionIndex = source.indexOf(sourceMarker);
  assert(`${name}: upstream semantic pipeline is required before source acquisition`, authorityIndex >= 0 && acquisitionIndex > authorityIndex);
  assert(`${name}: the same required pipeline is passed into manifest projection`, source.includes('projectRouteSyncManifestForRouteManifest(') && source.includes('requestTypeDerivationPipeline,'));
  assert(`${name}: no second pipeline lookup occurs after preflight`, source.indexOf('requestTypeDerivationSemanticPipelineResolution.resolve(', authorityIndex + authorityMarker.length) === -1);
}

const preflight = read('packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts');
const contract = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionInterface.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
assert('preflight packet retains the original manifest and canonical semantic input', contract.includes('readonly manifest: RouteSyncManifest') && contract.includes('readonly input: RequestTypeDerivationInput') && preflight.includes('manifest,\n    input,'));
assert('authority lowering consumes the exact preflight input and ledgers', lowering.includes('operationPreparation.prepare(preflight.input)') && lowering.includes('const sourceEvidence = preflight.sourceEvidence') && lowering.includes('const requestResolutionLedger = preflight.requestResolutionLedger'));
assert('no legacy RequestType[] solver is wired into active authority projection', !read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts').includes('requestTypeDerivationSolver'));

for (const check of checks) process.stdout.write(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}\n`);
process.stdout.write(`\nPhase 2558: ${checks.filter(check => check.passed).length}/${checks.length} structural assertions passed.\n`);
if (checks.some(check => !check.passed)) process.exitCode = 1;
