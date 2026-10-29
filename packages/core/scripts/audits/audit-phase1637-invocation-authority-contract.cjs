const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'src/types/upstream/invocationSemanticJudgmentInterface.ts');
const authorityPath = path.join(root, 'src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const scannerPath = path.join(root, 'src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlowRelations.ts');
const testPath = path.join(root, 'src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlow.phase219.test.ts');
const read = file => fs.readFileSync(file, 'utf8');
const contract = read(interfacePath);
const authority = read(authorityPath);
const scanner = read(scannerPath);
const test = read(testPath);
const checks = [
  ['InvocationSemanticInput carries typed knowledge and one invocation', /export interface InvocationSemanticInput\s*\{[\s\S]*readonly knowledge: SemanticKnowledgeDataFlow;[\s\S]*readonly invocation: SemanticInvocation;/m.test(contract)],
  ['Canonical authority analyze(input) returns one judgment', /export interface InvocationSemanticAuthorityInterface\s*\{\s*readonly kind: 'invocation_semantic_authority';\s*readonly analyze: \(input: InvocationSemanticInput\) => InvocationSemanticJudgment;/m.test(contract)],
  ['Canonical authority binds algebra through the interface', /export const invocationSemanticAuthority:\s*InvocationSemanticAuthorityInterface\s*= Object\.freeze\(\{\s*kind: 'invocation_semantic_authority',\s*analyze: \(input: InvocationSemanticInput\): InvocationSemanticJudgment =>\s*analyzeInvocationJudgmentAlgebra\(input\.knowledge, input\.invocation\),/m.test(authority)],
  ['Aggregate analysis is explicitly separate for compatibility', /export const analyzeAllInvocationSemantics = \(knowledge: SemanticKnowledgeDataFlow\): InvocationSemanticAnalysis/m.test(authority)],
  ['Scanner facade does not import generic rewrite executor', !/semanticRewriteRuntimeExecutor|executeRelations/.test(scanner)],
  ['Regression test exercises one-in/one-judgment interface', /analyzeInvocationSemantics\(\{\s*knowledge: model,\s*invocation:/m.test(test)],
];
let failed = false;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed = true;
}
if (failed) process.exitCode = 1;
