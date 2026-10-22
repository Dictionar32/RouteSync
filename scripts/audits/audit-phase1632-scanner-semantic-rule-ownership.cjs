const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const walkFiles = (directory) => fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
  const relative = path.posix.join(directory, entry.name);
  return entry.isDirectory() ? walkFiles(relative) : [relative];
});
const scannerProductionFiles = walkFiles('packages/core/src/compiler/scanner').filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'));
const scannerProductionSource = scannerProductionFiles.map(read).join('\n');
const directSolverCallFiles = scannerProductionFiles.filter((file) => /solveSemanticRelations(?:Detailed)?\s*</.test(read(file)) || /solveSemanticRelations(?:Detailed)?\s*\(/.test(read(file)));
const runtimeFactoryCallFiles = scannerProductionFiles.filter((file) => /create[A-Za-z]+RuntimeExecutor\s*\(/.test(read(file)));

const scannerIdentity = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticObjectIdentityRelations.ts');
const scannerTypedRelation = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticTypedRelation.ts');
const identityInterface = read('packages/core/src/types/upstream/semanticObjectIdentityInterface.ts');
const identityAuthority = read('packages/core/src/types/upstream/semanticObjectIdentityAuthority.ts');
const typedRelationAuthority = read('packages/core/src/types/upstream/semanticTypedRelation.ts');
const test = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticObjectIdentity.phase225.test.ts');
const scannerConstraint = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticConstraintHandlingRules.ts');
const constraintInterface = read('packages/core/src/types/upstream/semanticConstraintHandlingInterface.ts');
const constraintAuthority = read('packages/core/src/types/upstream/semanticConstraintHandlingAuthority.ts');
const constraintTest = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticConstraintHandlingRules.phase303.test.ts');
const scannerInterprocedural = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlowRelations.ts');
const interproceduralInterface = read('packages/core/src/types/upstream/semanticInterproceduralDataFlowInterface.ts');
const interproceduralAuthority = read('packages/core/src/types/upstream/semanticInterproceduralDataFlowAuthority.ts');
const scannerRewriteFacade = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteEngine.ts');
const scannerIndex = read('packages/core/src/compiler/scanner/lexer/routeAst/index.ts');
const checks = [
  { name: 'scanner-identity-module-is-upstream-facade', passed: /export \* from ['"]\.\.\/\.\.\/\.\.\/\.\.\/types\/upstream\/semanticObjectIdentityInterface['"]/.test(scannerIdentity) && !/IDENTITY_REWRITES|assignment-reference:by-reference|solveSemanticRelations/.test(scannerIdentity) },
  { name: 'alias-inference-rules-are-upstream-contract-data', passed: /SEMANTIC_OBJECT_IDENTITY_RULES/.test(identityInterface) && /assignment-reference:by-reference/.test(identityInterface) && /same-identity:must-alias/.test(identityInterface) },
  { name: 'authority-delegates-to-canonical-runtime-executor', passed: /semanticRewriteRuntimeExecutor\.executeRelations/.test(identityAuthority) && !/solveSemanticRelations/.test(identityAuthority) },
  { name: 'closed-and-incomplete-analysis-preserve-proof', passed: /status: 'closed'/.test(identityInterface) && /status: 'incomplete'/.test(identityInterface) && /proof: SemanticRelationExecutionClosedJudgment/.test(identityInterface) && /proof: SemanticRelationExecutionIncompleteJudgment/.test(identityInterface) },
  { name: 'typed-relation-algebra-is-upstream-owned', passed: /export \* from ['"]\.\.\/\.\.\/\.\.\/\.\.\/types\/upstream\/semanticTypedRelation['"]/.test(scannerTypedRelation) && /export const typedProject/.test(typedRelationAuthority) },
  { name: 'upstream-authority-does-not-import-scanner', passed: !/compiler\/scanner/.test(identityAuthority) && !/compiler\/scanner/.test(identityInterface) },
  { name: 'constraint-handling-scanner-is-thin-facade', passed: /export \* from ['"]\.\.\/\.\.\/\.\.\/\.\.\/types\/upstream\/semanticConstraintHandlingInterface['"]/.test(scannerConstraint) && !/const matchGroup|const settle|normalizeRule/.test(scannerConstraint) },
  { name: 'constraint-handling-contract-has-closed-and-incomplete-results', passed: /status: 'closed'/.test(constraintInterface) && /status: 'incomplete'/.test(constraintInterface) && /reason: 'max_rounds_exceeded'/.test(constraintInterface) },
  { name: 'constraint-handling-authority-enforces-round-budget', passed: /if \(maxRounds <= 0\)/.test(constraintAuthority) && /nextRounds >= maxRounds/.test(constraintAuthority) && /semanticConstraintHandlingAuthority/.test(constraintAuthority) },
  { name: 'interprocedural-rules-and-analysis-are-upstream-owned', passed: /SEMANTIC_INTERPROCEDURAL_DATAFLOW_RULES/.test(interproceduralInterface) && /semanticRewriteRuntimeExecutor\.executeRelations/.test(interproceduralAuthority) && /export \* from ['"]\.\.\/\.\.\/\.\.\/\.\.\/types\/upstream\/semanticInterproceduralDataFlowInterface['"]/.test(scannerInterprocedural) },
  { name: 'scanner-rewrite-facade-is-type-only', passed: /export type/.test(scannerRewriteFacade) && !/solveSemanticRelations|rewriteSemanticRelations|solveSemanticRelationsDetailed/.test(scannerRewriteFacade) && !/export \* from ['"]\.\/semanticRewriteEngine['"]/.test(scannerIndex) },
  { name: 'production-scanner-has-no-direct-generic-solver-calls', passed: directSolverCallFiles.length === 0 },
  { name: 'executor-factories-are-confined-to-scanner-wiring-composition', passed: runtimeFactoryCallFiles.length === 2 && runtimeFactoryCallFiles.every((file) => file.includes('/wiring/')) },
  { name: 'regression-tests-cover-closed-alias-and-round-limit', passed: /analysis\.status !== 'closed'/.test(test) && /same\.status !== 'resolved'/.test(test) && /alias\.status !== 'resolved'/.test(test) && /zero-round budget/.test(constraintTest) && /changing first round/.test(constraintTest) },
];
const report = { phase: 1632, title: 'Scanner thin facade and upstream semantic rule ownership', scannerProductionFileCount: scannerProductionFiles.length, directSolverCallFiles, runtimeFactoryCallFiles, checks, passed: checks.filter((check) => check.passed).length, total: checks.length };
fs.writeFileSync(path.join(root, 'PHASE1632_SCANNER_SEMANTIC_RULE_OWNERSHIP_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'PHASE1632_SCANNER_SEMANTIC_RULE_OWNERSHIP_AUDIT.md'), [
  '# Phase 1632 — Scanner Thin Facade and Upstream Semantic Rule Ownership', '',
  `The audit scanned ${report.scannerProductionFileCount} production TypeScript files under \`core/src/compiler/scanner\`. Object-identity and interprocedural inference rules, typed relation algebra, and CHR-style constraint solving are upstream-owned. Scanner modules for these domains are compatibility facades. Object-identity and interprocedural reasoning delegate relation closure to the canonical rewrite runtime executor and preserve closed versus incomplete judgments with proof. Constraint handling exposes a closed/incomplete contract and enforces the round budget before claiming saturation. The scanner rewrite facade is type-only; generic solver runtime is no longer exported from the scanner index. Direct generic solver call sites: ${report.directSolverCallFiles.length}. Executor factory call sites: ${report.runtimeFactoryCallFiles.length} (wiring composition only).`, '',
  '## Checks', '',
  ...checks.map((check) => `- ${check.passed ? 'PASS' : 'FAIL'} — **${check.name}**`), '',
  `Result: **${report.passed}/${report.total} checks passed**.`, '',
  'Static source audit only; it does not replace TypeScript typechecking, runtime tests, or the full build.', '',
].join('\n'));
console.log(`${report.passed}/${report.total} checks passed`);
for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
if (report.passed !== report.total) process.exitCode = 1;
