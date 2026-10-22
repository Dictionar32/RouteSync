const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const assert = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const production = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const coreIndex = read('packages/core/src/index.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const composition = read('packages/cli/src/upstreamCompositionInterface.ts');

assert('resolution ADT is declared in canonical upstream RequestType contract', contract.includes('export type RequestTypeDerivationSemanticPipelineResolution ='));
assert('available result carries the existing consumer pipeline', contract.includes("kind: 'request_type_semantic_pipeline_available'") && contract.includes('readonly pipeline: RequestTypeDerivationSemanticPipelineInterface'));
assert('unavailable result names missing production composition', contract.includes("kind: 'request_type_semantic_pipeline_unavailable'") && contract.includes("reason: 'cli_upstream_composition_missing'"));
assert('missing result names the two required composition members', contract.includes("'manifest_composition'") && contract.includes("'request_type_semantic_pipeline'"));
assert('resolution interface exposes named operation', contract.includes('interface RequestTypeDerivationSemanticPipelineResolutionInterface') && contract.includes('readonly resolve:'));
assert('named export const implements resolution interface', production.includes('export const requestTypeDerivationSemanticPipelineResolution: RequestTypeDerivationSemanticPipelineResolutionInterface'));
assert('resolver emits closed unavailable ADT without throwing', production.includes("kind: 'request_type_semantic_pipeline_unavailable'") && production.includes("reason: 'cli_upstream_composition_missing'"));
assert('legacy require wrapper delegates to resolver', production.includes('requestTypeDerivationSemanticPipelineResolution.resolve(pipeline === undefined'));
assert('core public barrel exports resolver operation and resolution types', coreIndex.includes('requestTypeDerivationSemanticPipelineResolution') && coreIndex.includes('RequestTypeDerivationSemanticPipelineResolutionInterface'));
assert('scan resolves semantic pipeline before source acquisition', scan.indexOf('requestTypeDerivationSemanticPipelineResolution.resolve') < scan.indexOf('createLaravelSourceProjectIdentity(targetDir)'));
assert('sync resolves semantic pipeline before source acquisition', sync.indexOf('requestTypeDerivationSemanticPipelineResolution.resolve') < sync.indexOf('createLaravelSourceProjectIdentity(targetDir)'));
assert('scan handles unavailable composition as terminal CLI result', scan.includes("case 'request_type_semantic_pipeline_unavailable':") && scan.includes('process.exitCode = 1'));
assert('sync handles unavailable composition as terminal CLI result', sync.includes("case 'request_type_semantic_pipeline_unavailable':") && sync.includes('process.exitCode = 1'));
assert('commands consume the resolved pipeline instead of calling throwing guard', scan.includes('const requestTypeDerivationPipeline = pipelineResolution.pipeline') && sync.includes('const requestTypeDerivationPipeline = pipelineResolution.pipeline') && !scan.includes('requireRequestTypeDerivationSemanticPipeline') && !sync.includes('requireRequestTypeDerivationSemanticPipeline'));
assert('CLI composition still requires upstream pipeline injection', composition.includes('readonly requestTypeDerivationPipeline: RequestTypeDerivationSemanticPipelineInterface'));

for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
const failed = checks.filter(check => !check.passed);
console.log(`Phase 2568 CLI semantic pipeline resolution ADT: ${checks.length - failed.length}/${checks.length} assertions passed`);
if (failed.length) process.exitCode = 1;
