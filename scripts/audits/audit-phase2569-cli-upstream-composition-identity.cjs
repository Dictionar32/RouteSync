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

assert('resolution input is a named closed ADT', contract.includes('export type RequestTypeDerivationSemanticPipelineResolutionInput =') && contract.includes("kind: 'request_type_semantic_pipeline_supplied'") && contract.includes("kind: 'cli_upstream_composition_missing'"));
assert('resolution no longer accepts an optional pipeline primitive', contract.includes('readonly resolve: (\n    input: RequestTypeDerivationSemanticPipelineResolutionInput') && !contract.includes('pipeline?: RequestTypeDerivationSemanticPipelineInterface'));
assert('unavailable outcome describes missing CLI composition rather than unverified semantic capabilities', contract.includes("reason: 'cli_upstream_composition_missing'") && contract.includes("'manifest_composition'") && contract.includes("'request_type_semantic_pipeline'"));
assert('resolution contract version evolved to 2', contract.includes("readonly contractVersion: 2") && production.includes('contractVersion: 2'));
assert('named resolver branches exhaustively on the input ADT', production.includes("case 'request_type_semantic_pipeline_supplied':") && production.includes("case 'cli_upstream_composition_missing':") && production.includes('const exhaustive: never = input'));
assert('core public barrel exports resolution input ADT', coreIndex.includes('RequestTypeDerivationSemanticPipelineResolutionInput'));
assert('CLI composition contract requires both manifest and semantic pipeline', composition.includes('readonly manifestComposition: ControllerInvocationManifestCompositionAuthorityInterface') && composition.includes('readonly requestTypeDerivationPipeline: RequestTypeDerivationSemanticPipelineInterface'));
for (const [name, source] of [['scan', scan], ['sync', sync]]) {
  assert(`${name} converts absent host composition into explicit ADT before acquisition`, source.includes("kind: 'cli_upstream_composition_missing'") && source.includes("kind: 'request_type_semantic_pipeline_supplied'") && source.indexOf('requestTypeDerivationSemanticPipelineResolution.resolve') < source.indexOf('createLaravelSourceProjectIdentity(targetDir)'));
  assert(`${name} terminally rejects missing composition without legacy fallback`, source.includes("case 'request_type_semantic_pipeline_unavailable':") && source.includes('process.exitCode = 1') && !source.includes('requestTypeDerivationSolver'));
}
assert('legacy throwing guard delegates through explicit input ADT', production.includes('requestTypeDerivationSemanticPipelineResolution.resolve(pipeline === undefined') && production.includes('case \'request_type_semantic_pipeline_unavailable\':'));

for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
const failed = checks.filter(check => !check.passed);
console.log(`Phase 2569 CLI upstream composition identity: ${checks.length - failed.length}/${checks.length} assertions passed`);
if (failed.length) process.exitCode = 1;
