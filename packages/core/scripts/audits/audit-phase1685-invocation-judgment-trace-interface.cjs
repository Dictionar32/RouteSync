const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const judgment = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const publicIndex = read('packages/core/src/index.ts');
const upstream = read('packages/core/src/types/upstream/index.ts');
const runtime = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const checks = [
  ['proof trace is a first-class domain contract rather than scanner-generated diagnostics', /export interface InvocationSemanticJudgmentTraceContract/.test(pipeline) && /INVOCATION_SEMANTIC_JUDGMENT_TRACE_CONTRACT/.test(pipeline) && /traceOwner: 'semantic-algebra-produces-authority-validates-scanner-forwards'/.test(pipeline)],
  ['trace contract binds subject identity, rule coverage, evidence, witnesses, obligations, and closure', /subjectIdentity:/.test(pipeline) && /ruleCoverage:/.test(pipeline) && /evidenceLineage:/.test(pipeline) && /witnessLineage:/.test(pipeline) && /obligationLineage:/.test(pipeline) && /closureCorrelation:/.test(pipeline)],
  ['canonical pipeline distinguishes single judgment, independent input batch, and complete knowledge analysis', /readonly analyzeInvocation:/.test(pipeline) && /readonly analyzeBatch:/.test(pipeline) && /readonly analyzeKnowledge:[\s\S]*SemanticKnowledgeDataFlow[\s\S]*InvocationSemanticAnalysis/.test(pipeline) && /knowledgeAnalysisMeaning: 'analyze-complete-semantic-knowledge-and-preserve-individual-judgment-traces'/.test(pipeline)],
  ['pipeline contract composes trace and scanner boundaries under version 9', /readonly version: 12/.test(pipeline) && /judgmentTrace: InvocationSemanticJudgmentTraceContract/.test(pipeline) && /judgmentTrace: INVOCATION_SEMANTIC_JUDGMENT_TRACE_CONTRACT/.test(pipeline) && /readonly scannerBoundary: InvocationSemanticScannerBoundaryContract/.test(pipeline)],
  ['existing judgment carries a typed proof rule trace and unresolved obligations', /export type InvocationSemanticRuleTraceEntry =/.test(judgment) && /readonly ruleTrace: readonly InvocationSemanticRuleTraceEntry\[\]/.test(judgment) && /readonly unresolvedObligations: readonly SemanticInvocationObligation\[\]/.test(judgment)],
  ['authority interface owns trace validation and executor interface promises trace-preserving delegation', /proof\/witness and rule-trace ownership/.test(judgment) && /including its\s+\*?\s*proof ruleTrace and obligations/.test(judgment) && /Whole-knowledge analysis; each judgment retains its own authority-validated proof trace/.test(judgment)],
  ['trace contract is reachable through upstream and public package exports', /export \* from '\.\/invocationSemanticPipelineInterface'/.test(upstream) && /INVOCATION_SEMANTIC_JUDGMENT_TRACE_CONTRACT/.test(publicIndex) && /InvocationSemanticJudgmentTraceContract/.test(publicIndex)],
  ['scanner still delegates aggregate analysis rather than implementing semantic reasoning', /invocationSemanticRuntimeExecutor\.executeAll\(semanticKnowledgeDataFlow\)/.test(scanner) && !/deriveTargetResolution|deriveArgumentBinding|deriveEffectProjection|closeJudgment/.test(scanner)],
  ['runtime executor remains unchanged and delegation-only in this interface-first phase', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(runtime) && /executeAll: batchAuthority\.analyze/.test(runtime)],
  ['new interface model adds no any, generic callable boundary, or semantic foundation dependency', !/:\s*any\b|\bFunction\b|semantic\/foundation/.test(pipeline)],
];
let failed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`Phase 1685 invocation judgment-trace interface audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
