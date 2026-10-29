const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('src/types/upstream/invocationSemanticJudgmentInterface.ts');
const algebra = read('src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const executor = read('src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const scanner = read('src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlowRelations.ts');
const regression = read('src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlow.phase219.test.ts');
const checks = [
  ['Contract version 6 retains explicit target ambiguity policy', /readonly version: 6/.test(contract) && /id: 'invocation-target-ambiguity'[\s\S]*when: 'more-than-one-distinct-callable-target'[\s\S]*obligation: 'callable_target_ambiguous'[\s\S]*resolutionPolicy: 'explicit-resolution-required'/.test(contract)],
  ['Ambiguity is a typed obligation retaining candidate callable identities', /kind: 'callable_target_ambiguous'[\s\S]*candidateCallables: readonly SemanticCallable\[\]/.test(contract)],
  ['Canonical semantic rule catalog owns ambiguity rule', /INVOCATION_SEMANTIC_RULES[\s\S]*INVOCATION_TARGET_AMBIGUITY_RULE/.test(contract)],
  ['Duplicate evidence for one invocation/callable identity is deduplicated', /const uniqueCallTargets = \(targets:[\s\S]*knowledgeIdKey\(target\.invocation\.id\)[\s\S]*knowledgeIdKey\(target\.callable\.id\)/.test(algebra) && (algebra.match(/uniqueCallTargets\(typedExpand\(/g) || []).length === 2],
  ['Batch algebra emits ambiguity obligation for multiple distinct targets', /targetAmbiguityObligations[\s\S]*targets\.length > 1[\s\S]*candidateCallables/.test(algebra) && /\.\.\.targetAmbiguityObligations/.test(algebra)],
  ['Single judgment emits ambiguity obligation before closure', /callTargets\.length > 1[\s\S]*INVOCATION_TARGET_AMBIGUITY_RULE\.obligation[\s\S]*candidateCallables/.test(algebra)],
  ['Rule trace records ambiguity obligation separately from unresolved target', /ambiguityObligations[\s\S]*INVOCATION_TARGET_AMBIGUITY_RULE\.id, subjectInvocation: invocation\.id[\s\S]*outcome: ambiguityObligations\.length > 0 \? 'obligation-emitted'/.test(algebra)],
  ['Regression test covers ambiguous candidates and duplicate evidence', /keeps multiple callable candidates incomplete[\s\S]*duplicate witness[\s\S]*candidateCallables[\s\S]*invocation-target-ambiguity/.test(regression)],
  ['Runtime executor remains a pure authority delegate', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor)],
  ['Scanner remains free of semantic inference/rewrite', /invocationSemanticRuntimeExecutor/.test(scanner) && !/executeRelations|analyzeInvocationSemanticAlgebra|analyzeInvocationJudgmentAlgebra|callable_target_ambiguous/.test(scanner)],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed = true;
}
if (failed) process.exitCode = 1;
