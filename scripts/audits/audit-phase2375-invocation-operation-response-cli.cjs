const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const files = {
  invocationContract: read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts'),
  executionContract: read('packages/core/src/types/upstream/invocationSemanticExecutionBoundaryContract.ts'),
  runtime: read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts'),
  pipeline: read('packages/core/src/types/upstream/invocationSemanticPipeline.ts'),
  compositionInterface: read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts'),
  dataflowAuthority: read('packages/core/src/types/upstream/controllerDataflowSemanticJudgmentAuthority.ts'),
  dataflowModel: read('packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts'),
  controllerScanner: read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'),
  sourceAstPipeline: read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts'),
  cli: read('packages/cli/src/commands/scan.ts'),
  pathAuthority: read('packages/core/src/types/upstream/routePathResolutionAuthority.ts'),
};
const checks = [
  ['invocation semantic judgment has an upstream authority contract', files.invocationContract.includes('interface InvocationSemanticAuthorityInterface') && files.invocationContract.includes('readonly analyze: (input: InvocationSemanticInput) => InvocationSemanticJudgment')],
  ['operation contract defines runtime delegation rather than semantic derivation', files.executionContract.includes('INVOCATION_SEMANTIC_RUNTIME_EXECUTOR_CONTRACT') && files.executionContract.includes('target-resolution') && files.executionContract.includes('proof-synthesis')],
  ['runtime executor delegates single invocation to injected authority', files.runtime.includes('execute: (input: InvocationSemanticInput): InvocationSemanticJudgment => authority.analyze(input)')],
  ['runtime executor delegates whole-knowledge analysis to batch authority', files.runtime.includes('executeAll: (knowledge: SemanticKnowledgeDataFlow) => batchAuthority.analyze(knowledge)')],
  ['operation pipeline uses the runtime executor for invocation judgment', files.pipeline.includes('runtimeExecutor.execute(input)')],
  ['integrated response composition runs inventory and analysis over the same canonical knowledge', files.pipeline.includes('input.semanticKnowledgeProjection.knowledge') && files.pipeline.includes('dependencies.inventory.inspectKnowledge(knowledge)') && files.pipeline.includes('dependencies.pipeline.analyzeKnowledge(knowledge)')],
  ['integrated response preserves publication and exact PHP source outcome', files.pipeline.includes('publication,') && files.pipeline.includes('phpFunctionInvocations: input.phpSourceInvocationPipeline')],
  ['controller dataflow verifies source identity before integrating response', files.dataflowAuthority.includes('requireSameSourceFileIdentity(sourceCorrelation.sourceFile, sourceCorrelation.invocationJudgment.sourceFile, dependencies.sourceIdentitySemantics)') && files.dataflowAuthority.includes('requireSameSourceFileIdentity(sourceCorrelation.sourceFile, sourceCorrelation.semanticKnowledgeProjection.sourceFile, dependencies.sourceIdentitySemantics)')],
  ['controller dataflow passes exact projection and exact invocation response to composition', files.dataflowAuthority.includes('semanticKnowledgeProjection: sourceCorrelation.semanticKnowledgeProjection') && files.dataflowAuthority.includes('phpSourceInvocationPipeline: sourceCorrelation.invocationJudgment.response')],
  ['controller dataflow model retains both integrated response and original judgment', files.dataflowModel.includes('readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult') && files.dataflowModel.includes('readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface')],
  ['controller scanner receives the source-correlated invocation judgment before projection', files.controllerScanner.includes('invocationJudgment') && files.controllerScanner.includes('parseControllerDeclarationFromInvocationJudgment')],
  ['source AST pipeline wires the controller scanner', files.sourceAstPipeline.includes('controllerScanner: laravelControllerScanner')],
  ['CLI scan enters the invocation-aware manifest composition', files.cli.includes('buildManifestWithInvocationPipeline')],
  ['path authority no longer depends on compiler-owned parameter factory', !files.pathAuthority.includes('compiler/scanner/semantic/route/routeParameterSemanticFactory')],
  ['path authority emits closed parameter ADTs without relation/foundation imports', files.pathAuthority.includes("kind: 'route_parameter'") && !files.pathAuthority.includes('semantic/relations') && !files.pathAuthority.includes('semantic/foundation') && !files.pathAuthority.includes('semantic/relation')],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`RESULT ${checks.filter(([, passed]) => passed).length}/${checks.length}`);
process.exitCode = checks.every(([, passed]) => passed) ? 0 : 1;
