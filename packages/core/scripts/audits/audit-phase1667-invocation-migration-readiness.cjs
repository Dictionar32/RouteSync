const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const algebra = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const authority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const tests = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlow.phase219.test.ts');
const checks = [
  ['new judgment requires argumentBinding', /readonly argumentBinding: InvocationArgumentBindingJudgment/.test(iface)],
  ['algebra still returns legacy argumentParameters', /argumentParameters:\s*slice\.bindings/.test(algebra)],
  ['algebra still performs positional index inference', /invocation\.arguments\.flatMap\(\(argument, argumentIndex\)[\s\S]*?resolved\.parameters\[argumentIndex\]/.test(algebra)],
  ['new positional evidence is not produced by algebra', !/InvocationPositionalArgumentEvidence|invocation_positional_argument_evidence/.test(algebra)],
  ['Phase 219 test retains stale correspondence expectation', /invocation-argument-index-to-callable-parameter-index/.test(tests) && /normalized-positional-argument-to-parameter-order/.test(iface)],
  ['algebra witness still uses legacy binding fields', /kind: 'argument-binding' as const,[\s\S]*?invocation,[\s\S]*?bindings: slice\.bindings/.test(algebra)],
  ['authority lacks argument binding invariant validation', !/argumentBinding\.(?:bindings|unboundArguments|positionalEvidence)/.test(authority)],
  ['aggregate compatibility projection still reads argumentParameters', /analysis\.argumentParameters/.test(algebra)],
  ['Phase 219 tests still assert old aggregate field', /analysis\.argumentParameters/.test(tests)],
  ['runtime executor delegates to authority', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor)],
  ['scanner delegates invocation analysis to executor', /invocationSemanticRuntimeExecutor\.executeAll\(semanticKnowledgeDataFlow\)/.test(scanner)],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} audit observations confirmed\n`);
process.exitCode = failed === 0 ? 0 : 1;
