const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const algebraBoundary = read('packages/core/src/types/upstream/invocationSemanticAlgebraBoundaryInterface.ts');
const judgment = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const packageIndex = read('packages/core/src/index.ts');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const stagedAlgebra = read('packages/core/src/types/upstream/invocationSemanticAlgebraInterface.ts');
const checks = [
  ['pipeline contract composes the exact canonical judgment contract', /readonly judgmentContract:\s*InvocationSemanticContract/.test(pipeline) && /judgmentContract:\s*INVOCATION_SEMANTIC_CONTRACT/.test(pipeline)],
  ['pipeline contract composes the canonical high-level algebra contract', /readonly algebraBoundary:\s*InvocationSemanticAlgebraBoundaryContract/.test(pipeline) && /algebraBoundary:\s*INVOCATION_SEMANTIC_ALGEBRA_BOUNDARY_CONTRACT/.test(pipeline)],
  ['pipeline contract version records the new judgment-contract composition', /readonly version: 12/.test(pipeline) && /kind: 'invocation_semantic_pipeline_contract',\s*version: 12,/.test(pipeline)],
  ['pipeline batch semantics distinguish per-input judgments from aggregate analysis', /readonly batchMeaning: 'one-independent-judgment-per-input-in-input-order-not-an-aggregate-knowledge-analysis'/.test(pipeline)],
  ['pipeline retains same-order and same-invocation batch correspondence', /readonly batchCorrespondence: 'one-output-entry-per-input-in-the-same-order-with-the-same-invocation-identity'/.test(pipeline)],
  ['pipeline preserves independent evidence and proof for each invocation', /readonly batchIsolation: 'each-invocation-retains-its-own-evidence-judgment-and-proof'/.test(pipeline)],
  ['algebra boundary exposes one domain-level derive operation', /readonly derive:\s*\(input: InvocationSemanticInput\) => InvocationSemanticJudgment/.test(algebraBoundary)],
  ['judgment authority contract is a defined upstream semantic contract', /export interface InvocationSemanticContract/.test(judgment) && /export const INVOCATION_SEMANTIC_CONTRACT/.test(judgment)],
  ['closed and incomplete judgment variants remain distinct', /InvocationClosedSemanticJudgment/.test(judgment) && /InvocationIncompleteSemanticJudgment/.test(judgment)],
  ['result and exception emission flows remain distinct', /InvocationResultEmissionFlow/.test(judgment) && /InvocationExceptionEmissionFlow/.test(judgment)],
  ['public upstream barrel exposes high-level boundary and pipeline', /export \* from '\.\/invocationSemanticAlgebraBoundaryInterface'/.test(upstreamIndex) && /export \* from '\.\/invocationSemanticPipelineInterface'/.test(upstreamIndex)],
  ['package public API exports the high-level pipeline interface and contract', /InvocationSemanticPipelineInterface/.test(packageIndex) && /INVOCATION_SEMANTIC_PIPELINE_CONTRACT/.test(packageIndex)],
  ['staged low-level algebra is not exported through upstream barrel', !/export \* from '\.\/invocationSemanticAlgebraInterface'/.test(upstreamIndex)],
  ['runtime executor remains a delegation-only binding', /wiring only; semantic reasoning stays in upstream algebra/.test(executor) && /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor)],
  ['scanner still delegates to the existing executor instead of new pipeline wiring', /invocationSemanticRuntimeExecutor\.executeAll\(semanticKnowledgeDataFlow\)/.test(scanner) && !/INVOCATION_SEMANTIC_PIPELINE_CONTRACT|analyzeBatch\(/.test(scanner)],
  ['legacy staged algebra remains internal migration scaffolding', /Legacy internal staged derivation contract/.test(stagedAlgebra) && /Do not export this multi-operation surface/.test(stagedAlgebra)],
  ['new contract surface avoids any, generic callable boundaries, and semantic foundation', !/:\s*any\b|\bFunction\b|semantic\/foundation/.test(pipeline + algebraBoundary)],
];
let failed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`Phase 1682 invocation contract-closure audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
