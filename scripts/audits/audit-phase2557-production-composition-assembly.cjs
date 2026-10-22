const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const assert = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const composition = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const index = read('packages/core/src/index.ts');
const preflight = read('packages/core/src/compiler/scanner/wiring/routeManifestRequestResolutionPreflight.ts');
const preflightContract = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionInterface.ts');
const authorityProjection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts');
const authorityLowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');

assert('production composition calls canonical semantic pipeline assembler', composition.includes('createRequestTypeDerivationSemanticPipelineAssembler<TContract, TInference>().assemble(composition)'));
assert('assembly returns typed assembled-or-rejected result', composition.includes('RequestTypeDerivationSemanticPipelineAssemblyResult'));
assert('canonical assembler checks capability contract identity', assembler.includes('composition.reasoning.contract === composition.contract') && assembler.includes('composition.verifier.contract === composition.contract') && assembler.includes('composition.decision.contract === composition.contract') && assembler.includes('composition.authority.contract === composition.contract'));
assert('active manifest projection requires an injected semantic pipeline', projection.includes('pipeline: RequestTypeDerivationSemanticPipelineInterface') && projection.includes('createAuthorityBackedRouteManifestProjection(pipeline)'));
assert('CLI scan remains on authority projection path', scan.includes('projectRouteSyncManifestForRouteManifest') && scan.includes('requestTypeDerivationSemanticPipelineResolution.resolve(composition === undefined') && scan.includes('const requestTypeDerivationPipeline = pipelineResolution.pipeline') && scan.includes('createScanCommand = (composition?') && scan.includes('manifestComposition.compose(') && scan.includes('requestTypeDerivationPipeline,'));
assert('CLI sync remains on authority projection path', sync.includes('projectRouteSyncManifestForRouteManifest') && sync.includes('requestTypeDerivationSemanticPipelineResolution.resolve(composition === undefined') && sync.includes('const requestTypeDerivationPipeline = pipelineResolution.pipeline') && sync.includes('createSyncCommand = (composition?') && sync.includes('manifestComposition.compose(') && sync.includes('requestTypeDerivationPipeline,'));
assert('core exports production assembly factory', index.includes('assembleRequestTypeDerivationProductionPipeline'));
assert('no legacy solver fallback is provided by production composition', composition.includes('Legacy RequestType[] fallback is disabled') && !composition.includes('requestTypeDerivationSolver'));
assert('composition does not import semantic relations or foundation', !composition.includes('semantic/relations') && !composition.includes('semantic/foundation'));
assert('preflight packet binds manifest and exact semantic input', preflightContract.includes('readonly manifest: RouteSyncManifest') && preflightContract.includes('readonly input: RequestTypeDerivationInput') && preflight.includes('manifest,\n    input,'));
assert('authority projection forwards the same preflight packet', projection.includes('projection.project(preflight)') && authorityProjection.includes('lowering.project(preflight)'));
assert('authority lowering consumes the preflight input and ledgers without rebuilding inventory', authorityLowering.includes('operationPreparation.prepare(preflight.input)') && authorityLowering.includes('const sourceEvidence = preflight.sourceEvidence') && authorityLowering.includes('const requestResolutionLedger = preflight.requestResolutionLedger') && !authorityLowering.includes('requestTypeDerivationSourceEvidenceInventory.inventory'));

for (const check of checks) process.stdout.write(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}\n`);
process.stdout.write(`\nPhase 2557: ${checks.filter(check => check.passed).length}/${checks.length} structural assertions passed.\n`);
if (checks.some(check => !check.passed)) process.exitCode = 1;
