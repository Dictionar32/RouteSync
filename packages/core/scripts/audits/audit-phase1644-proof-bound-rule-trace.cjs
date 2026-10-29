const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('src/types/upstream/invocationSemanticJudgmentInterface.ts');
const algebra = read('src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const regression = read('src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlow.phase219.test.ts');
const scanner = read('src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlowRelations.ts');
const checks = [
  ['Runtime contract constant matches declared version 6', /readonly version: 6/.test(contract) && /INVOCATION_SEMANTIC_CONTRACT:[\s\S]*version: 6/.test(contract)],
  ['Proof contract binds invocation identity, rule evidence, and rule obligations', /proofBinds: readonly \[.*'invocation-identity'.*'rule-specific-evidence'.*'rule-specific-obligations'/s.test(contract) && /'invocation-identity',[\s\S]*'rule-specific-evidence',[\s\S]*'rule-specific-obligations'/.test(contract)],
  ['Every trace entry carries subject identity and evidence/obligation witnesses', /interface InvocationSemanticRuleTraceEntry \{[\s\S]*subjectInvocation: KnowledgeId[\s\S]*evidence: readonly SemanticSource\[\][\s\S]*obligations: readonly SemanticInvocationObligation\[\]/.test(contract)],
  ['Derived trace binds exact subject invocation', /subjectInvocation: invocation\.id/.test(algebra) && /subjectInvocation: requestedInvocation\.id/.test(algebra)],
  ['Rule trace stores evidence and obligation arrays instead of counts only', /evidence: targetEvidence, obligations: Object\.freeze\(ambiguityObligations\)/.test(algebra) && /evidence: Object\.freeze\(\[requestedInvocation\.source\]\), obligations: Object\.freeze\(\[obligation\]\)/.test(algebra)],
  ['Regression coverage checks trace witness identity and evidence', /subjectInvocation/.test(regression) && /ambiguityTrace\?\.evidence/.test(regression) && /obligations: \[expect\.objectContaining\(\{ kind: 'callable_target_ambiguous' \}\)\]/.test(regression)],
  ['Scanner remains a delegate and contains no semantic trace construction', /invocationSemanticRuntimeExecutor/.test(scanner) && !/invocationRuleTraceFor|callable_target_ambiguous|executeRelations|analyzeInvocationSemanticAlgebra|analyzeInvocationJudgmentAlgebra/.test(scanner)],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed = true;
}
if (failed) process.exitCode = 1;
