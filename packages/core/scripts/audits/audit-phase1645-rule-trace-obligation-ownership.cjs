const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('src/types/upstream/invocationSemanticJudgmentInterface.ts');
const algebra = read('src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const regression = read('src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlow.phase219.test.ts');
const scanner = read('src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlowRelations.ts');
const checks = [
  ['Contract version 6 declares rule trace ownership and witness-count invariants', /readonly version: 6/.test(contract) && /obligationOwnership: 'declaring-rule-only'/.test(contract) && /obligationCount: 'equals-obligation-witness-count'/.test(contract)],
  ['Proof binding explicitly includes rule ownership and trace counts', /'rule-obligation-ownership'[\s\S]*'trace-obligation-counts'/.test(contract)],
  ['Target-resolution rule does not claim unresolved-target obligations', /ruleId: INVOCATION_TARGET_RESOLUTION_RULE\.id,[^\n]*obligations: targetResolutionObligations/.test(algebra) && /targetResolutionObligations = INVOCATION_SEMANTIC_CONTRACT\.trace\.obligationOwnership === 'declaring-rule-only'/.test(algebra)],
  ['Unresolved-target rule owns unresolved target obligations', /ruleId: INVOCATION_UNRESOLVED_TARGET_RULE\.id,[^\n]*obligations: Object\.freeze\(targetObligations\)/.test(algebra)],
  ['Ambiguity trace retains its own typed obligation', /ruleId: INVOCATION_TARGET_AMBIGUITY_RULE\.id,[^\n]*obligations: Object\.freeze\(ambiguityObligations\)/.test(algebra)],
  ['Regression test verifies rule-specific ownership and witness counts', /targetResolutionTrace\?\.obligations\)\.toEqual\(\[\]\)/.test(regression) && /unresolvedTrace\?\.obligations/.test(regression) && /obligationCount\)\.toBe\([^\n]*obligations\.length/.test(regression)],
  ['Scanner remains a delegate without rule ownership reasoning', /invocationSemanticRuntimeExecutor/.test(scanner) && !/targetResolutionObligations|obligationOwnership|callable_target_ambiguous|invocationRuleTraceFor|executeRelations/.test(scanner)],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed = true;
}
if (failed) process.exitCode = 1;
