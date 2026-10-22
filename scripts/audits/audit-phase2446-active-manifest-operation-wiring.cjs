const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const compositionContract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const builderContract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const sourcePipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const sourcePipelineContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const coreIndex = read('packages/core/src/index.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const packageJson = JSON.parse(read('package.json'));
const changedPathSources = [composition, compositionContract, builder, builderContract];
const checks = [
  ['active CLI no longer imports a removed manifestBuilder singleton', !/\bmanifestBuilder\s*,/.test(composition.slice(0, composition.indexOf("from '@routesync/core'"))) && !/dependencies\.manifestBuilder/.test(composition)],
  ['CLI uses the existing exported upstream operation preparer', /prepareManifestBuilderOperation/.test(composition) && /export \{ prepareManifestBuilderOperation \}/.test(coreIndex)],
  ['CLI preserves the exact validated receipt and route-selection intent as manifest operation input', /invocationInventoryReceipt: inventoryResult\.receipt, routeSelection/.test(composition) && /kind: 'manifest_builder_input'/.test(composition)],
  ['manifest operation stores request data on its typed contract', /readonly input: ManifestBuilderInput/.test(builderContract) && /input,/.test(builder)],
  ['manifest execution has no method parameters', /readonly build: \(\) => Promise<ManifestBuilderJudgment>/.test(builderContract) && /async build\(\): Promise<ManifestBuilderJudgment>/.test(builder)],
  ['source-AST execution has no method parameters and carries its input as operation data', /readonly input: LaravelSourceAstPipelineExecutionInput<Receipt>/.test(sourcePipelineContract) && /readonly execute: \(\) => Promise<LaravelSourceAstProjectionJudgment<Receipt>>/.test(sourcePipelineContract) && /async execute\(\): Promise<LaravelSourceAstProjectionJudgment<Receipt>>/.test(sourcePipeline)],
  ['source-AST runtime has no parameterized executor helper or unbound singleton', !/executeLaravelSourceAstPipeline/.test(sourcePipeline) && !/export const laravelSourceAstPipeline:/.test(sourcePipeline) && /createLaravelSourceAstPipeline<Receipt extends[\s\S]*?dependencies:[\s\S]*?input: LaravelSourceAstPipelineExecutionInput<Receipt>/.test(sourcePipeline)],
  ['manifest preparation contains no const arrow-function runtime helper', !/const\s+\w+\s*=\s*\([^)]*\)\s*=>/.test(builder)],
  ['manifest builder executes the input-bound source-AST operation without arguments', /this\.sourceAstPipeline\.execute\(\)/.test(builder) && /sourceAstPipeline = createLaravelSourceAstPipeline\(laravelSourceAstPipelineDependencies, pipelineInput\)/.test(builder)],
  ['source-AST complete and blocked judgments remain distinct', /projection\.kind !== 'laravel_source_ast_projection_complete'/.test(builder) && /kind: 'manifest_builder_blocked'/.test(builder) && /kind: 'manifest_builder_complete'/.test(builder)],
  ['manifest composition contract no longer declares the stale manifest-builder dependency', !/manifestBuilder:\s*ManifestBuilderInterface/.test(compositionContract) && /readonly version: 6/.test(compositionContract)],
  ['legacy runtime rewrite forwarder remains removed from production exports', !exists('packages/core/src/types/upstream/semanticRewriteRuntimeExecutor.ts') && !/semanticRewriteRuntimeExecutor/.test(upstreamIndex)],
  ['no semantic foundation or relation dependency was added to changed manifest path', !changedPathSources.some(source => /semantic\/(foundation|relations)/.test(source))],
  ['audit command is registered', packageJson.scripts['audit:phase2446-active-manifest-operation-wiring'] === 'node scripts/audits/audit-phase2446-active-manifest-operation-wiring.cjs'],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} assertions passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
