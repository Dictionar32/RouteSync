const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['upstream contract declares a selection law', /selection:\s*SemanticDecisionSelectionPolicy/.test(read('packages/core/src/types/upstream/semanticDecisionInterface.ts'))],
  ['judgment carries proof receipts', /SemanticDecisionProof/.test(read('packages/core/src/types/upstream/semanticDecisionInterface.ts')) && /evaluated:\s*readonly SemanticDecisionRuleReceipt/.test(read('packages/core/src/types/upstream/semanticDecisionInterface.ts'))],
  ['algebra records skipped, failed and selected rules', ['not_applicable', 'no_result', 'selected'].every((value) => read('packages/core/src/types/upstream/semanticDecisionAlgebra.ts').includes(value))],
  ['algebra rejects unknown selection policy', read('packages/core/src/types/upstream/semanticDecisionAlgebra.ts').includes('unsupported_selection_policy')],
  ['AST precedence policy is upstream-owned', read('packages/core/src/types/upstream/scannerAstExpressionCandidateInterface.ts').includes('SCANNER_AST_EXPRESSION_PRECEDENCE')],
  ['scanner consumes upstream precedence instead of constructing rule order', read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts').includes('precedence: SCANNER_AST_EXPRESSION_PRECEDENCE') && !read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts').includes('const astRuleOrder')],
  ['existing controller semantic authority declares the policy', read('packages/core/src/types/upstream/controllerVariableSemanticAuthority.ts').includes("selection: 'first_proven_by_precedence'")],
  ['regression tests cover proof-bearing judgments', read('packages/core/src/types/upstream/__test__/semanticDecisionAlgebra.phase1427.test.ts').includes('semantic_decision_proof') && read('packages/core/src/types/upstream/__test__/semanticDecisionAlgebra.phase1457.test.ts').includes('termination: \'exhausted\'')],
];
let failed = false;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed = true;
}
process.stdout.write(`Phase 1557 audit: ${checks.filter(([, ok]) => ok).length}/${checks.length} passed\n`);
if (failed) process.exitCode = 1;
