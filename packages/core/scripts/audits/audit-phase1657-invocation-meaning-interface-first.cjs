const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const iface = read('src/types/upstream/invocationSemanticJudgmentInterface.ts');
const authority = read('src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const executor = read('src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const algebra = read('src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const scanner = read('src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const checks = [
  ['Invocation interface owns a high-level meaning model', /interface InvocationSemanticMeaningModel/.test(iface) && /readonly meaning: InvocationSemanticMeaningModel/.test(iface)],
  ['Meaning contract declares target cardinality and ambiguity semantics', /targetCardinality: 'exactly-one-distinct-target-for-closure'/.test(iface) && /multipleTargets: 'retain-candidates-and-mark-ambiguous'/.test(iface)],
  ['Meaning contract declares positional binding and incomplete closure', /invocation-argument-index-to-callable-parameter-index/.test(iface) && /solverClosureAlone: 'insufficient'/.test(iface)],
  ['Public contract exposes the same authoritative meaning model', /meaning: INVOCATION_SEMANTIC_MODEL\.meaning/.test(iface) && /readonly version: 14/.test(iface) && /version: 14/.test(iface)],
  ['Algebra reads result and exception kinds from the model', /INVOCATION_SEMANTIC_MODEL\.meaning\.effects\.resultKind/.test(algebra) && /INVOCATION_SEMANTIC_MODEL\.meaning\.effects\.exceptionKind/.test(algebra)],
  ['Authority validates judgments before returning them', /assertInvocationSemanticJudgmentContract\([\s\S]*analyzeInvocationJudgmentAlgebra/.test(authority)],
  ['Runtime executor delegates without semantic branches', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor) && !/switch\s*\(|if\s*\(/.test(executor)],
  ['Scanner delegates invocation analysis through the executor', /invocationSemanticRuntimeExecutor\.executeAll\(semanticKnowledgeDataFlow\)/.test(scanner) && !/compileSemanticJudgmentModel|createSemanticLawCompilerRegistry|target-ambiguous|argument-parameter-unresolved/.test(scanner)],
  ['No generic callable boundary was introduced', !/callableBoundary/.test(iface) && !/GenericCallableBoundary/.test(iface)],
];
let failed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`RESULT ${checks.length - failed}/${checks.length} passed\n`);
if (failed) process.exitCode = 1;
