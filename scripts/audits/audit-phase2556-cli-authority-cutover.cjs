const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const assert = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const composition = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts');

assert('active projection imports authority-backed projection', projection.includes("from './routeManifestProjectionAuthority'"));
assert('active projection no longer imports legacy lowering', !projection.includes("from './routeManifestTypeLowering'"));
assert('active projection requires semantic pipeline explicitly', projection.includes('pipeline: RequestTypeDerivationSemanticPipelineInterface'));
assert('scan CLI requires production semantic pipeline', scan.includes('requestTypeDerivationSemanticPipelineResolution.resolve(composition === undefined') && scan.includes("case 'request_type_semantic_pipeline_unavailable'") && scan.includes('createScanCommand = (composition?'));
assert('sync CLI requires production semantic pipeline', sync.includes('requestTypeDerivationSemanticPipelineResolution.resolve(composition === undefined') && sync.includes("case 'request_type_semantic_pipeline_unavailable'") && sync.includes('createSyncCommand = (composition?'));
assert('scan CLI handles non-projectable judgment', scan.includes("case 'not_projectable'"));
assert('sync CLI handles non-projectable judgment', sync.includes("case 'not_projectable'"));
assert('missing production composition fails closed', composition.includes('throw new Error(') && composition.includes('Legacy RequestType[] fallback is disabled'));
assert('legacy solver still exists only as an inactive module', fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts')) && lowering.includes('requestTypeDerivationProjectionPipeline.derive'));
assert('new production composition path does not import semantic relations', !composition.includes('semantic/relations'));
assert('new production composition path does not import semantic foundation', !composition.includes('semantic/foundation'));

for (const check of checks) process.stdout.write(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}\n`);
process.stdout.write(`\nPhase 2556: ${checks.filter(check => check.passed).length}/${checks.length} structural assertions passed.\n`);
if (checks.some(check => !check.passed)) process.exitCode = 1;
