const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlowRelations.ts');
const test = read('packages/core/src/compiler/scanner/lexer/routeAst/semanticInterproceduralDataFlow.phase219.test.ts');
const controllerAnalyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const controllerAst = read('packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts');
const knowledgeAdapter = read('packages/core/src/compiler/scanner/lexer/routeAst/phpAstSemanticKnowledgeDataFlowAdapter.ts');
const checks = [
  ['versioned callable-boundary invariants', /version: 8;[\s\S]*callableBoundary:[\s\S]*contract-validated-judgment/.test(contract)],
  ['authority publishes canonical contract', /readonly contract: InvocationSemanticContract/.test(contract) && /contract: INVOCATION_SEMANTIC_CONTRACT/.test(authority)],
  ['authority validates identity, trace, obligations, and closure', /assertInvocationSemanticJudgmentContract/.test(authority) && /result invocation identity differs from request/.test(authority) && /trace obligation count differs from obligation witnesses/.test(authority) && /closed judgment has incomplete rewrite proof/.test(authority)],
  ['executor exposes contract and delegates only', /contract: authority\.contract/.test(executor) && /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor)],
  ['scanner facade delegates through upstream boundary', /invocationSemanticRuntimeExecutor/.test(scanner) && /types\/upstream\/invocationSemanticRuntimeExecutor/.test(scanner)],
  ['production scanner calls batch callable boundary', /invocationSemanticRuntimeExecutor\.executeAll\(semanticKnowledgeDataFlow\)/.test(controllerAnalyzer) && /invocationSemanticAnalysis/.test(controllerAst) && /invocationSemanticAnalysis/.test(controllerAnalyzer)],
  ['scanner does not implement invocation resolution policy', !/callable_target_unresolved|callable_target_ambiguous|invocation-positional-argument-binding|invocation-target-resolution/.test(controllerAnalyzer)],
  ['PHP knowledge adapter imports every relational predicate it uses', /import \{ relationEqual, relationNotEqual \}/.test(knowledgeAdapter) && /relationNotEqual\(candidate, key\)/.test(knowledgeAdapter) && /source: semanticPresent\(scopeSource\)/.test(knowledgeAdapter)],
  ['runtime boundary contract test added', /invocationSemanticRuntimeExecutor\.execute/.test(test) && /invocationSemanticRuntimeExecutor\.contract/.test(test)],
  ['no foundation imports in invocation boundary files', ![contract, authority, executor, read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts'), scanner].some((source) => /semantic\/foundation/.test(source))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
