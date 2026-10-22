const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const execution = read('packages/core/src/types/upstream/invocationSemanticExecutionBoundaryContract.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const algebra = read('packages/core/src/types/upstream/invocationSemanticAlgebraBoundaryInterface.ts');
const judgment = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const upstream = read('packages/core/src/types/upstream/index.ts');
const publicIndex = read('packages/core/src/index.ts');
const runtime = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const authorityImpl = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const checks = [
  ['authority boundary contract binds canonical judgment contract', /readonly judgment:\s*InvocationSemanticContract/.test(execution) && /judgment:\s*INVOCATION_SEMANTIC_CONTRACT/.test(execution)],
  ['authority boundary contract binds canonical high-level algebra contract', /readonly algebra:\s*InvocationSemanticAlgebraBoundaryContract/.test(execution) && /algebra:\s*INVOCATION_SEMANTIC_ALGEBRA_BOUNDARY_CONTRACT/.test(execution)],
  ['authority owns validation rather than semantic re-derivation', /derivationOwnership: 'domain-algebra-derives-the-judgment-authority-does-not-rederive-meaning'/.test(execution) && /validationOwnership: 'authority-validates-identity-evidence-proof-obligations-and-closure-before-return'/.test(execution)],
  ['runtime contract forbids semantic derivation responsibilities', /readonly forbiddenResponsibilities: readonly \[/.test(execution) && /'target-resolution'/.test(execution) && /'judgment-closure'/.test(execution)],
  ['runtime contract separates one-input execution from aggregate execution', /readonly singleExecution:/.test(execution) && /readonly aggregateExecution:/.test(execution)],
  ['pipeline composes authority boundary contract', /readonly authorityBoundary:\s*InvocationSemanticAuthorityBoundaryContract/.test(pipeline) && /authorityBoundary:\s*INVOCATION_SEMANTIC_AUTHORITY_BOUNDARY_CONTRACT/.test(pipeline)],
  ['pipeline composes runtime executor contract', /readonly runtimeExecutor:\s*InvocationSemanticRuntimeExecutorContract/.test(pipeline) && /runtimeExecutor:\s*INVOCATION_SEMANTIC_RUNTIME_EXECUTOR_CONTRACT/.test(pipeline)],
  ['pipeline contract version records complete boundary composition', /readonly version: 12/.test(pipeline) && /kind: 'invocation_semantic_pipeline_contract',\s*version: 12,/.test(pipeline)],
  ['algebra still exposes one high-level operation', /readonly derive:\s*\(input: InvocationSemanticInput\) => InvocationSemanticJudgment/.test(algebra) && !/deriveTargetResolution|deriveArgumentBinding|deriveEffectProjection|closeJudgment/.test(algebra)],
  ['canonical judgment and authority interfaces remain typed', /export interface InvocationSemanticAuthorityInterface/.test(judgment) && /readonly analyze: \(input: InvocationSemanticInput\) => InvocationSemanticJudgment/.test(judgment)],
  ['new contracts are exported through upstream barrel', /export \* from '\.\/invocationSemanticExecutionBoundaryContract'/.test(upstream)],
  ['new contracts are exported through package public API', /INVOCATION_SEMANTIC_AUTHORITY_BOUNDARY_CONTRACT/.test(publicIndex) && /InvocationSemanticRuntimeExecutorContract/.test(publicIndex)],
  ['runtime implementation is unchanged in this interface-only phase', /authority\.analyze\(input\)/.test(runtime)],
  ['authority implementation is unchanged in this interface-only phase', /analyzeInvocationJudgmentAlgebra\(/.test(authorityImpl)],
  ['contract surface contains no any, generic callable boundary, or semantic foundation dependency', !/:\s*any\b|\bFunction\b|semantic\/foundation/.test(execution + pipeline)],
];
let failed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`Phase 1683 invocation execution-contract audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
