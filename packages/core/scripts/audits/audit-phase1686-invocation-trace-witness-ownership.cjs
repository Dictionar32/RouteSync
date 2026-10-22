const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const algebra = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const publicIndex = read('packages/core/src/index.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const runtime = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const checks = [
  ['trace entry is a discriminated union keyed by semantic rule identity', /export type InvocationSemanticRuleTraceEntry = \{[\s\S]*\[RuleId in InvocationSemanticTraceRuleId\]: InvocationSemanticRuleTraceEntryFor<RuleId>/.test(judgment)],
  ['witness ownership is constrained by rule id at the type level', /type InvocationSemanticWitnessForRule/.test(judgment) && /invocation-target-resolution'[\s\S]*kind: 'target-resolution'/.test(judgment) && /invocation-result-emission'[\s\S]*effect: 'result'/.test(judgment) && /invocation-exception-emission'[\s\S]*effect: 'exception'/.test(judgment)],
  ['argument-form evidence rule cannot claim a derivation witness', /'invocation-argument-form-evidence': Readonly<\{[\s\S]*?readonly witnesses: readonly never\[\]/.test(judgment)],
  ['algebra constructs rule-specific witness arrays instead of attaching a broad witness union', /case 'invocation-target-resolution':[\s\S]*witness\.kind === 'target-resolution'/.test(algebra) && /case 'invocation-result-emission':[\s\S]*witness\.effect === 'result'/.test(algebra) && /case 'invocation-exception-emission':[\s\S]*witness\.effect === 'exception'/.test(algebra)],
  ['judgment contract version advances for the stronger typed trace contract', /readonly version: 35/.test(judgment) && /version: 35,/.test(judgment)],
  ['pipeline contract version 9 explicitly records typed trace witness ownership', /readonly version: 12/.test(pipeline) && /version: 12,/.test(pipeline) && /trace-entry-type-restricts-witness-kinds-to-the-owning-semantic-rule-and-authority-validates-runtime-ownership/.test(pipeline)],
  ['typed trace rule identifiers are exported from the public package API', /InvocationSemanticRuleTraceEntry,[\s\S]*?InvocationSemanticTraceRuleId/.test(publicIndex)],
  ['scanner remains a delegation caller with no invocation derivation logic', /invocationSemanticRuntimeExecutor\.executeAll\(semanticKnowledgeDataFlow\)/.test(scanner) && !/deriveTargetResolution|deriveArgumentBinding|deriveEffectProjection|closeJudgment/.test(scanner)],
  ['runtime executor remains a thin delegation boundary in the interface-first phase', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(runtime) && /executeAll: batchAuthority\.analyze/.test(runtime)],
  ['new trace model adds no any, generic callable boundary, or semantic foundation dependency', !/:\s*any\b|\bFunction\b|semantic\/foundation/.test(judgment.slice(judgment.indexOf('export type InvocationSemanticTraceRuleId')))],
];
let failed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`Phase 1686 invocation trace-witness ownership audit: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
