const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('src/types/upstream/invocationSemanticJudgmentInterface.ts');
const algebra = read('src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const authority = read('src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const executor = read('src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const scanner = read('src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlowRelations.ts');
const single = algebra.slice(algebra.indexOf('export const analyzeInvocationJudgmentAlgebra ='), algebra.indexOf('export const callTargetForInvocation'));
const checks = [
  ['Semantic contract version 6 retains dependency slicing', /readonly version: 6/.test(contract) && /dependencySlice:[\s\S]*targetEvidence: 'requested-invocation-callable-data-flow'[\s\S]*callableKnowledge: 'resolved-targets-only'[\s\S]*emissionKnowledge: 'declared-emissions-of-resolved-targets-only'[\s\S]*unrelatedEvidence: 'excluded-before-derivation'/.test(contract)],
  ['Single-judgment path does not invoke batch algebra', !/analyzeInvocationSemanticAlgebra\(/.test(single)],
  ['Rewrite seeds are sliced to requested invocation target evidence', /const scopedFlows = Object\.freeze\(model\.dataFlow\.filter\(flow =>[\s\S]*knowledgeIdKey\(flow\.source\), invocationKey\)/.test(single) && /const seed:[\s\S]*typedRelation\(scopedFlows\)/.test(single)],
  ['Callable knowledge is sliced to resolved target identities', /const targetIds = Object\.freeze\(scopedFlows\.map\(flow => knowledgeIdKey\(flow\.target\)\)\)/.test(single) && /const scopedCallables = Object\.freeze\(callableFacts\(model\)\.filter/.test(single)],
  ['Emission knowledge is sliced to resolved callable declarations', /const requiredEmissionIds = Object\.freeze\(scopedCallables\.flatMap/.test(single) && /emissionFacts\(model\)\.filter\(emission =>[\s\S]*requiredEmissionIds/.test(single)],
  ['Authority delegates to one-judgment algebra', /analyzeInvocationJudgmentAlgebra\(input\.knowledge, input\.invocation\)/.test(authority)],
  ['Runtime executor only delegates', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor)],
  ['Scanner facade contains no semantic inference or rewrite', /invocationSemanticRuntimeExecutor/.test(scanner) && !/executeRelations|analyzeInvocationSemanticAlgebra|analyzeInvocationJudgmentAlgebra/.test(scanner)],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed = true;
}
if (failed) process.exitCode = 1;
