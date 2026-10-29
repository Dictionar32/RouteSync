const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const algebra = read('packages/core/src/types/upstream/invocationSemanticAlgebraInterface.ts');
const judgment = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const packageIndex = read('packages/core/src/index.ts');
const implementation = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const authority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const scanner = read('packages/core/src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlowRelations.ts');
const checks = [
  ['argument-form outcome is a discriminated semantic judgment rather than nullable evidence', /kind: 'positional-form-established'/.test(pipeline) && /kind: 'argument-form-unproven'/.test(pipeline) && !/InvocationArgumentFormJudgment\s*=\s*InvocationPositionalArgumentEvidence\s*\|\s*null/.test(pipeline)],
  ['argument-form evidence producer has a dedicated upstream interface', /interface InvocationArgumentFormEvidenceInterface/.test(pipeline) && /deriveArgumentForm/.test(pipeline)],
  ['argument-form unproven outcome retains a typed obligation and evidence', /readonly obligation: Extract<SemanticInvocationObligation, \{ readonly kind: 'argument_form_unproven' \}>/.test(pipeline) && /readonly evidence: InvocationSemanticEvidence/.test(pipeline)],
  ['batch input retains one explicit semantic input per invocation', /interface InvocationSemanticBatchInput/.test(pipeline) && /readonly entries: readonly InvocationSemanticInput\[\]/.test(pipeline)],
  ['batch judgment preserves ordered invocation-to-judgment correspondence', /interface InvocationSemanticBatchJudgment/.test(pipeline) && /readonly invocation: SemanticInvocation/.test(pipeline) && /readonly judgment: InvocationSemanticJudgment/.test(pipeline)],
  ['batch authority has a canonical contract separate from legacy knowledge-wide batch analysis', /interface InvocationSemanticBatchAuthorityInterface/.test(pipeline) && /analyzeBatch/.test(pipeline)],
  ['scanner boundary explicitly delegates single and batch work through executor', /interface InvocationSemanticScannerBoundaryInterface/.test(pipeline) && /readonly executor: InvocationSemanticRuntimeExecutorInterface/.test(pipeline) && /executeInvocation/.test(pipeline) && /executeBatch/.test(pipeline)],
  ['pipeline stage order covers evidence through downstream projection', /'source-evidence'/.test(pipeline) && /'argument-form-judgment'/.test(pipeline) && /'invocation-algebra'/.test(pipeline) && /'judgment-authority'/.test(pipeline) && /'runtime-executor'/.test(pipeline) && /'scanner-delegation'/.test(pipeline) && /'downstream-projection'/.test(pipeline)],
  ['pipeline contract explicitly prohibits invented evidence and semantic reclassification', /evidence-is-produced-upstream-and-never-invented-by-algebra-or-scanner/.test(pipeline) && /each-algebra-phase-consumes-prior-judgments-without-reclassification/.test(pipeline)],
  ['pipeline contract is exported from upstream and package public indexes', /export \* from '\.\/invocationSemanticPipelineInterface'/.test(upstreamIndex) && /INVOCATION_SEMANTIC_PIPELINE_CONTRACT/.test(packageIndex) && /InvocationSemanticScannerBoundaryInterface/.test(packageIndex)],
  ['algebra interface remains separately declared as its own domain boundary', /interface InvocationSemanticAlgebraInterface/.test(algebra) && /deriveTargetResolution/.test(algebra) && /deriveArgumentBinding/.test(algebra) && /deriveEffectProjection/.test(algebra) && /closeJudgment/.test(algebra)],
  ['judgment, authority, executor, and scanner implementation files were not migrated in this interface-only phase', /type InvocationSemanticJudgment\s*=/.test(judgment) && /assertInvocationSemanticJudgmentContract/.test(authority) && /execute:/.test(executor) && /invocationSemanticRuntimeExecutor/.test(scanner)],
  ['new pipeline interface does not implement or wire semantic derivation', !/invocationSemanticAlgebra\s*\./.test(pipeline) && !/assertInvocationSemanticJudgmentContract/.test(pipeline) && !/execute:\s*\(/.test(pipeline)],
  ['new pipeline interface does not introduce any or foundation dependency', !/\bany\b/.test(pipeline) && !/semantic\/foundation/.test(pipeline)],
];
let failed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`Phase 1678 interface-first pipeline audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
