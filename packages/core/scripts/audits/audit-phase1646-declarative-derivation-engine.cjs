const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('src/types/upstream/invocationSemanticJudgmentInterface.ts');
const compiler = read('src/types/upstream/semanticJudgmentRuleCompiler.ts');
const genericInterface = read('src/types/upstream/semanticJudgmentDerivationInterface.ts');
const upstreamIndex = read('src/types/upstream/index.ts');
const algebra = read('src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const test = read('src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlow.phase219.test.ts');
const scanner = read('src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlowRelations.ts');
const executor = read('src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const checks = [
  ['Contract v6 binds rule application premises and bindings into proof', /readonly version: 6/.test(contract) && /'rule-application-premises-and-bindings'/.test(contract) && /applications: SemanticRelationExecutionJudgment/.test(contract)],
  ['Target resolution owns a declarative premise/conclusion program in the interface', /derivation: Object\.freeze\([\s\S]*premises: Object\.freeze\(\[Object\.freeze\([\s\S]*relation: 'data-flow'[\s\S]*value: 'callable'[\s\S]*conclusions: Object\.freeze\(\[Object\.freeze\([\s\S]*relation: 'call-target'/.test(contract)],
  ['Generic derivation algebra is a reusable upstream interface exported from the barrel', /SemanticJudgmentDerivationProgram/.test(genericInterface) && /premises: readonly SemanticJudgmentRelationPattern/.test(genericInterface) && /conclusions: readonly SemanticJudgmentRelationPattern/.test(genericInterface) && /semanticJudgmentDerivationInterface/.test(upstreamIndex) && !/invocation/i.test(genericInterface)],
  ['Generic compiler lowers any compatible declarative rule without invocation-specific branches', /compileSemanticJudgmentRule/.test(compiler) && /rule\.derivation\.premises\.map/.test(compiler) && /rule\.derivation\.conclusions\.map/.test(compiler) && !/invocation-target-resolution|callable_target_ambiguous/.test(compiler) && !/invocation-target-resolution|callable_target_ambiguous/.test(compiler)],
  ['Invocation algebra uses generic compiler and no longer handwrites target rule patterns', /compileSemanticJudgmentRule<InvocationRelation, string>/.test(algebra) && !/const invocationTargetRule =/.test(algebra) && !/INVOCATION_TARGET_RESOLUTION_RULE\.evidence\.role/.test(algebra.slice(0, algebra.indexOf('const invocationFacts')))],
  ['Trace stores concrete premise witnesses and bindings for each target derivation', /targetApplications = Object\.freeze\(rewrite\.derivations\.filter/.test(algebra) && /applications: targetApplications/.test(algebra) && /application\.premises\.length > 0/.test(test)],
  ['Aggregate trace preserves per-invocation proof traces rather than fabricating one', /judgments\.flatMap\(judgment => judgment\.proof\.ruleTrace\)/.test(algebra)],
  ['Regression coverage expects contract v6 and bound derivation witnesses', /INVOCATION_SEMANTIC_CONTRACT\.version\)\.toBe\(6\)/.test(test) && /targetResolutionTrace\?\.applications\.length\)\.toBe\(2\)/.test(test)],
  ['Runtime executor remains a pure authority delegate', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor)],
  ['Scanner remains a caller without semantic derivation or rewrite logic', /invocationSemanticRuntimeExecutor/.test(scanner) && !/compileSemanticJudgmentRule|executeRelations|invocationRuleTraceFor|callable_target_ambiguous/.test(scanner)],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed = true;
}
if (failed) process.exitCode = 1;
