const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const runtimePath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const builderPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const indexPath = path.join(root, 'packages/core/src/index.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const builder = fs.readFileSync(builderPath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const checks = [
  ['route-selection input uses the existing closed Laravel selection intent ADT', /LaravelRouteSourceSelectionIntent/.test(contract) && /laravel_route_source_selection_default/.test(runtime) === false],
  ['executor input bundles receipt and selection intent', /interface LaravelSourceAstPipelineExecutionInput[\s\S]*?invocationInventoryReceipt:[\s\S]*?routeSelection: LaravelRouteSourceSelectionIntent/.test(contract)],
  ['runtime executor is parameterless and operation data is explicit', /readonly input: LaravelSourceAstPipelineExecutionInput<Receipt>/.test(contract) && /readonly execute: \(\) => Promise<LaravelSourceAstProjectionJudgment<Receipt>>/.test(contract)],
  ['pipeline contract version is advanced', /readonly contractVersion: 17/.test(contract) && /contractVersion: 17/.test(runtime)],
  ['runtime executor reads its declared operation data rather than parameters', /const input = this\.input/.test(runtime) && /const dependencies = this\.dependencies/.test(runtime) && !/executeLaravelSourceAstPipeline/.test(runtime)],
  ['route selection intent is retained without reconstruction', /sourceSelectionIntent: input\.routeSelection/.test(runtime)],
  ['operation carries the exact selection intent as visible data', /readonly input: LaravelSourceAstPipelineExecutionInput<Receipt>/.test(contract) && /input,/.test(runtime)],
  ['manifest composition prepares the executor ADT before parameterless execution', /laravel_source_ast_pipeline_execution_input/.test(builder) && /createLaravelSourceAstPipeline\(laravelSourceAstPipelineDependencies, pipelineInput\)/.test(builder) && /this\.sourceAstPipeline\.execute\(\)/.test(builder)],
  ['public index exports the source pipeline input and selection intent contracts', /LaravelSourceAstPipelineExecutionInput/.test(index) && /LaravelRouteSourceSelectionIntent/.test(index)],
  ['no foundation or relations dependency was added to executor files', !/semantic\/(?:foundation|relations)/.test(runtime + contract + builder)],
];
for (const [label, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
const failed = checks.filter(([, passed]) => !passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} checks passed\n`);
process.exitCode = failed.length === 0 ? 0 : 1;
