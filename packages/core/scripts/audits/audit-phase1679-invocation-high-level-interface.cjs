const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const packageIndex = read('packages/core/src/index.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['public contract exposes one high-level invocation operation rather than low-level derivation steps', /interface InvocationSemanticPipelineInterface/.test(pipeline) && /analyzeInvocation/.test(pipeline) && !/deriveTargetResolution|deriveArgumentBinding|deriveEffectProjection|closeJudgment/.test(pipeline)],
  ['pipeline batch is a domain result rather than a separate low-level authority interface', /interface InvocationSemanticPipelineBatch/.test(pipeline) && /InvocationSemanticPipelineEntry/.test(pipeline) && !/InvocationSemanticBatchAuthorityInterface/.test(pipeline)],
  ['single invocation consumes the canonical semantic input and returns a domain judgment', /input: InvocationSemanticInput/.test(pipeline) && /\) => InvocationSemanticJudgment/.test(pipeline)],
  ['batch preserves invocation-to-judgment association', /readonly invocation: SemanticInvocation/.test(pipeline) && /readonly judgment: InvocationSemanticJudgment/.test(pipeline)],
  ['contract establishes source evidence ownership and forbids invented evidence', /source-evidence-is-owned-upstream-and-is-never-invented-by-algebra-executor-or-scanner/.test(pipeline)],
  ['contract requires authority-validated judgments before return', /only-judgments-validated-against-the-invocation-semantic-contract-may-be-returned/.test(pipeline)],
  ['contract defines closed and incomplete judgment meaning', /closed-only-when-applicable-domain-obligations-are-satisfied-and-proof-is-closed/.test(pipeline) && /incomplete-judgments-preserve-proven-facts-and-all-unresolved-obligations/.test(pipeline)],
  ['batch contract preserves order, identity, and per-invocation proof isolation', /one-output-entry-per-input-in-the-same-order-with-the-same-invocation-identity/.test(pipeline) && /each-invocation-retains-its-own-evidence-judgment-and-proof/.test(pipeline)],
  ['scanner and downstream responsibilities are expressed at domain level', /collect-source-derived-input-and-delegate-without-semantic-reasoning/.test(pipeline) && /consume-validated-judgment-without-reconstructing-semantic-meaning/.test(pipeline)],
  ['public package index exports only high-level pipeline contracts', /InvocationSemanticPipelineInterface/.test(packageIndex) && /InvocationSemanticPipelineBatch/.test(packageIndex) && !/InvocationArgumentFormEvidenceInterface|InvocationSemanticBatchAuthorityInterface|InvocationSemanticScannerBoundaryInterface/.test(packageIndex)],
  ['upstream index exports the canonical interface module', /invocationSemanticPipelineInterface/.test(upstreamIndex)],
  ['interface introduces no any, generic callable boundary, or semantic foundation dependency', !/:\s*any\b|\bFunction\b|semantic\/foundation/.test(pipeline)],
];
let failed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`Phase 1679 high-level interface audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
