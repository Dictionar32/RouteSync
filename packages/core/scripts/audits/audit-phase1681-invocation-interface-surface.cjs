const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const packageIndex = read('packages/core/src/index.ts');
const algebraBoundary = read('packages/core/src/types/upstream/invocationSemanticAlgebraBoundaryInterface.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const judgment = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const algebraInternal = read('packages/core/src/types/upstream/invocationSemanticAlgebraInterface.ts');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const checks = [
  ['public upstream barrel does not export staged low-level algebra surface', !/export \* from '\.\/invocationSemanticAlgebraInterface'/.test(upstreamIndex)],
  ['high-level algebra boundary remains exported from upstream barrel', /export \* from '\.\/invocationSemanticAlgebraBoundaryInterface'/.test(upstreamIndex)],
  ['public package index exports only the high-level algebra boundary contract', /InvocationSemanticAlgebraBoundaryInterface/.test(packageIndex) && !/InvocationTargetResolutionAlgebraInput|InvocationArgumentBindingAlgebraInput|InvocationEffectProjectionAlgebraInput|InvocationJudgmentClosureAlgebraInput/.test(packageIndex)],
  ['algebra boundary exposes one complete domain operation', /readonly derive:\s*\(input: InvocationSemanticInput\) => InvocationSemanticJudgment/.test(algebraBoundary)],
  ['pipeline contract composes the canonical algebra boundary contract', /readonly algebraBoundary:\s*InvocationSemanticAlgebraBoundaryContract/.test(pipeline) && /algebraBoundary:\s*INVOCATION_SEMANTIC_ALGEBRA_BOUNDARY_CONTRACT/.test(pipeline)],
  ['pipeline contract version reflects the latest composition change', /readonly version: 12/.test(pipeline) && /kind: 'invocation_semantic_pipeline_contract',\s*version: 12,/.test(pipeline)],
  ['pipeline retains authority-validated judgment requirement', /judgments-validated-against-the-invocation-semantic-contract/.test(pipeline)],
  ['judgment model distinguishes closed and incomplete judgments', /InvocationClosedSemanticJudgment/.test(judgment) && /InvocationIncompleteSemanticJudgment/.test(judgment)],
  ['judgment model keeps result and exception flow types separate', /InvocationResultEmissionFlow/.test(judgment) && /InvocationExceptionEmissionFlow/.test(judgment)],
  ['legacy staged algebra explicitly marked internal migration scaffolding', /Legacy internal staged derivation contract/.test(algebraInternal) && /Do not export this multi-operation surface/.test(algebraInternal)],
  ['runtime executor remains documented as delegation rather than semantic authority', /wiring only; semantic reasoning stays in upstream algebra/.test(executor)],
  ['high-level boundary avoids any, generic callable abstractions, and semantic foundation', !/:\s*any\b|\bFunction\b|semantic\/foundation/.test(algebraBoundary + pipeline)],
];
let failed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`Phase 1681 invocation interface-surface audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
