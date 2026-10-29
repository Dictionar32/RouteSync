const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('src/types/upstream/invocationSemanticJudgmentInterface.ts');
const algebra = read('src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const executor = read('src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const scanner = read('src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlowRelations.ts');
const checks = [
  ['Interface declares scoped semantic execution policy', /readonly execution: Readonly<\{\s*readonly scope: 'requested-invocation-and-semantic-dependencies';\s*readonly unrelatedInvocations: 'excluded-before-rewrite';/m.test(contract)],
  ['Single judgment resolves requested invocation directly', /const invocation = invocationFacts\(model\)\.find\(/m.test(algebra) && /const invocation = invocationFacts\(model\)\.find\(/m.test(algebra) && /One-judgment path:[\s\S]*slice callable and emission knowledge/.test(algebra)],
  ['Rewrite seed excludes unrelated invocation flows', /const scopedFlows = Object\.freeze\(model\.dataFlow\.filter\(flow =>[\s\S]*knowledgeIdKey\(flow\.source\), invocationKey\)[\s\S]*INVOCATION_TARGET_RESOLUTION_RULE\.evidence\.role/m.test(algebra) && !/const scopedAnalysis = analyzeInvocationSemanticAlgebra\(scopedModel\)/.test(algebra)],
  ['Missing invocation is represented as typed obligation', /kind: 'invocation_evidence_missing',[\s\S]*reason: 'invocation_not_present_in_semantic_knowledge'/m.test(algebra)],
  ['Missing evidence trace distinguishes evidence absence from target resolution', /INVOCATION_EVIDENCE_PRESENCE_RULE\.id, subjectInvocation: requestedInvocation\.id[\s\S]*outcome: 'obligation-emitted'[\s\S]*INVOCATION_TARGET_RESOLUTION_RULE\.id, subjectInvocation: requestedInvocation\.id[\s\S]*outcome: 'no-conclusion'[\s\S]*INVOCATION_TARGET_AMBIGUITY_RULE\.id[\s\S]*INVOCATION_UNRESOLVED_TARGET_RULE\.id[\s\S]*INVOCATION_JUDGMENT_CLOSURE_RULE\.id[\s\S]*outcome: 'incomplete'/m.test(algebra)],
  ['Runtime executor only delegates to authority', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/m.test(executor)],
  ['Scanner facade delegates and contains no semantic execution', /invocationSemanticRuntimeExecutor/.test(scanner) && !/executeRelations|analyzeInvocationSemanticAlgebra/.test(scanner)],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed = true;
}
if (failed) process.exitCode = 1;
