const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('src/types/upstream/invocationSemanticJudgmentInterface.ts');
const algebra = read('src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const executor = read('src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const scanner = read('src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlowRelations.ts');
const checks = [
  ['Interface owns a typed invocation-evidence rule', /kind: 'invocation-evidence'[\s\S]*id: 'invocation-evidence-presence'[\s\S]*missingEvidence: 'invocation_evidence_missing-obligation'/.test(contract)],
  ['Canonical rule catalog includes evidence-presence rule', /INVOCATION_SEMANTIC_RULES[\s\S]*INVOCATION_EVIDENCE_PRESENCE_RULE/.test(contract)],
  ['Missing invocation is represented as invocation_evidence_missing', /kind: 'invocation_evidence_missing'[\s\S]*reason: 'invocation_not_present_in_semantic_knowledge'/.test(contract)],
  ['Missing-evidence trace records evidence rule obligation', /INVOCATION_EVIDENCE_PRESENCE_RULE\.id, subjectInvocation: requestedInvocation\.id[\s\S]*outcome: 'obligation-emitted'[\s\S]*INVOCATION_TARGET_RESOLUTION_RULE\.id, subjectInvocation: requestedInvocation\.id/.test(algebra)],
  ['Missing source evidence is not misreported as unresolved callable target', /INVOCATION_UNRESOLVED_TARGET_RULE\.id, subjectInvocation: requestedInvocation\.id[\s\S]*outcome: 'no-conclusion', derivedFactCount: 0, obligationCount: 0/.test(algebra)],
  ['Single-judgment path remains independent of batch analysis', !/analyzeInvocationSemanticAlgebra\(/.test(algebra.slice(algebra.indexOf('export const analyzeInvocationJudgmentAlgebra ='), algebra.indexOf('export const callTargetForInvocation')))],
  ['Executor remains a pure authority delegation', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor)],
  ['Scanner facade has no semantic algebra/rewrite call', /invocationSemanticRuntimeExecutor/.test(scanner) && !/executeRelations|analyzeInvocationSemanticAlgebra|analyzeInvocationJudgmentAlgebra/.test(scanner)],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed = true;
}
if (failed) process.exitCode = 1;
