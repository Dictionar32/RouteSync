const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const contract = read('packages/core/src/types/upstream/semanticRewriteInterface.ts');
const constraintContract = read('packages/core/src/types/upstream/semanticConstraintInterface.ts');
const authority = read('packages/core/src/types/upstream/semanticRewriteAuthority.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const rewriteTest = read('packages/core/src/types/upstream/__test__/semanticRewriteAuthority.phase1549.test.ts');
const constraintTest = read('packages/core/src/types/upstream/__test__/semanticConstraintAuthority.phase1550.test.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const manifestContract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const orchestrator = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['runtime forwarding implementation removed', !exists('packages/core/src/types/upstream/semanticRewriteRuntimeExecutor.ts')],
  ['runtime executor contract removed rather than renamed', !/SemanticRewriteRuntimeExecutorInterface|SemanticRelationExecutionRuntimeCapability/.test(contract)],
  ['constraint runtime capability removed', !/SemanticConstraintRuntimeCapability/.test(constraintContract)],
  ['upstream barrel no longer exports runtime factory or singleton', !/createSemanticRewriteRuntimeExecutor|semanticRewriteRuntimeExecutor/.test(index)],
  ['rewrite regression test calls upstream authority directly', /semanticRewriteAuthority\.resolve\(request\)/.test(rewriteTest) && !/createSemanticRewriteRuntimeExecutor/.test(rewriteTest)],
  ['constraint regression test calls upstream authority directly', /semanticRewriteAuthority\.resolveConstraints\(/.test(constraintTest) && !/createSemanticRewriteRuntimeExecutor/.test(constraintTest)],
  ['authority remains the semantic judgment owner', /resolve: derive/.test(authority) && /resolveConstraints: resolveSemanticConstraints/.test(authority) && /resolveRelations/.test(authority)],
  ['manifest input is carried as explicit operation data', /readonly input: ManifestBuilderInput/.test(manifestContract) && /input,/.test(manifestBuilder)],
  ['manifest executor operation has no runtime arguments', /async build\(\): Promise<ManifestBuilderJudgment>/.test(manifestBuilder) && /readonly build: \(\) => Promise<ManifestBuilderJudgment>/.test(manifestContract)],
  ['parameterized const helper and dependency factory are absent from manifest runtime', !/const\s+\w+\s*=\s*\([^)]*\)\s*=>/.test(manifestBuilder) && !/createManifestBuilder|constructRouteSyncManifest/.test(manifestBuilder)],
  ['CLI scanner prepares explicit operation data and executes without build arguments', /prepareManifestBuilderOperation\([\s\S]*?\)\.build\(\)/.test(orchestrator) && !/manifestBuilder\.build\(/.test(orchestrator)],
  ['active Laravel manifest builder executes a prepared source-AST operation and preserves its judgment', /this\.sourceAstPipeline\.execute\(\)/.test(manifestBuilder) && /sourceAstPipeline = createLaravelSourceAstPipeline\(laravelSourceAstPipelineDependencies, pipelineInput\)/.test(manifestBuilder) && /manifest_builder_blocked/.test(manifestBuilder)],
  ['audit command registered', packageJson.scripts['audit:phase2445-upstream-runtime-forwarder-removal'] === 'node scripts/audits/audit-phase2445-upstream-runtime-forwarder-removal.cjs'],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} assertions passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
