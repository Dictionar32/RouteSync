const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const compiler = read('packages/core/src/types/upstream/invocationSemanticModelCompiler.ts');
const algebra = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const checks = [
  ['interface models invocation with domain operations', /kind: 'target-resolution'[\s\S]*targetEvidence: 'invocation-callable-data-flow'[\s\S]*successfulJudgment: 'resolved-call-target'/.test(contract)],
  ['interface contains no relational premise/conclusion DSL', !/invocationDerivation\s*\(|invocationPattern\s*\(|premises:\s*readonly|conclusions:\s*readonly/.test(contract)],
  ['interface no longer imports generic rule-pattern types', !/SemanticJudgmentRuleTerm|SemanticJudgmentRelationPattern|SemanticJudgmentRuleDefinition/.test(contract)],
  ['model owns domain operation catalog', /judgment:\s*Object\.freeze\(\{[\s\S]*operations: invocationDerivationOperations/.test(contract)],
  ['dedicated compiler lowers model operations only', /INVOCATION_SEMANTIC_MODEL\.judgment\.operations\.flatMap/.test(compiler) && !/createSemanticLawCompilerRegistry|compileSemanticJudgmentModel/.test(compiler)],
  ['compiler reads canonical target evidence role', /INVOCATION_SEMANTIC_MODEL\.meaning\.identity\.targetEvidenceRole/.test(compiler)],
  ['algebra delegates lowering to invocation model compiler', /compileInvocationSemanticModel\(\)/.test(algebra) && !/invocationDerivation\s*\(|invocationPattern\s*\(/.test(algebra)],
  ['executor remains a pure authority delegate', /execute:\s*\(input: InvocationSemanticInput\): InvocationSemanticJudgment\s*=> authority\.analyze\(input\)/.test(executor)],
  ['scanner continues to delegate batch invocation analysis', /invocationSemanticRuntimeExecutor\.executeAll\(/.test(scanner)],
  ['model and contract versions are advanced together', /readonly version: 5/.test(contract) && /version: 6,/.test(contract) && /readonly version: 15/.test(contract) && /version: 15,/.test(contract)],
];
let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) failed += 1;
}
console.log(JSON.stringify({ phase: 1659, total: checks.length, passed: checks.length - failed, failed }, null, 2));
process.exitCode = failed ? 1 : 0;
