const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipeline.ts');
const contract = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const checks = [
  ['pipeline imports existing single and batch authorities', /import \{ invocationSemanticAuthority, semanticInterproceduralDataFlowAuthority \} from '\.\/invocationSemanticJudgmentAuthority'/.test(pipeline)],
  ['single invocation delegates directly to authority analyze', /invocationAuthority\.analyze\(input\)/.test(pipeline)],
  ['whole-knowledge analysis delegates directly to batch authority', /batchAuthority\.analyze\(knowledge\)/.test(pipeline)],
  ['pipeline factory injects two explicit authority contracts', /createInvocationSemanticPipeline = \(\s*invocationAuthority: InvocationSemanticAuthorityInterface,\s*batchAuthority: SemanticInterproceduralDataFlowAuthorityInterface/.test(pipeline)],
  ['pipeline implementation has no runtime executor dependency', !/runtimeExecutor|InvocationSemanticRuntimeExecutorInterface/.test(pipeline)],
  ['pipeline public interface exposes authorities, not runtime executor', /readonly invocationAuthority: InvocationSemanticAuthorityInterface/.test(contract) && /readonly batchAuthority: SemanticInterproceduralDataFlowAuthorityInterface/.test(contract) && !/readonly runtimeExecutor:/.test(contract)],
  ['pipeline contract version advanced to 61', /readonly version: 61/.test(contract) && /version: 61,/.test(contract)],
  ['contract records direct authority wiring', /authorityDependencyBinding: 'pipeline-factory-injects-existing-single-invocation-and-whole-knowledge-authorities-directly-without-runtime-forwarder'/.test(contract)],
  ['integrated response uses the pipeline contract operation', /dependencies\.pipeline\.analyzeKnowledge\(knowledge\)/.test(pipeline)],
  ['source-manifest runtime pipeline remains explicitly outside this phase', /sourceAstPipeline\.execute\(pipelineInput\)/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts'))],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} assertions passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
