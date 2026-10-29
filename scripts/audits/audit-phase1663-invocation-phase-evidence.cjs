const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const algebraPath = path.join(root, 'packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const testPath = path.join(root, 'packages/core/src/compiler/frontend/php/routeAst/semanticInterproceduralDataFlow.phase219.test.ts');
const contract = fs.readFileSync(interfacePath, 'utf8');
const algebra = fs.readFileSync(algebraPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const tests = fs.readFileSync(testPath, 'utf8');
const checks = [
  ['argument-binding witness owns the complete semantic binding collection', /kind: 'argument-binding'[\s\S]*?bindings: readonly SemanticArgumentParameterFlow\[\]/.test(contract)],
  ['target resolution witness owns aggregate target judgment', /kind: 'target-resolution'[\s\S]*?targets: readonly SemanticCallTarget\[\]/.test(contract) && /outcome: 'resolved' \| 'ambiguous' \| 'unresolved'/.test(contract)],
  ['witness construction no longer maps bindings into witnesses or per-binding provenance', !/slice\.bindings\.map\(/.test(algebra) && !/slice\.bindings\.map\(binding\s*=>\s*\(\{[\s\S]{0,240}kind:\s*'argument-binding'/.test(algebra)],
  ['public argument binding fact has no numeric argumentIndex', !/interface SemanticArgumentParameterFlow[\s\S]*?argumentIndex:\s*number/.test(contract)],
  ['argument-binding witness retains domain facts rather than reconstructing identities', /bindings:\s*slice\.bindings/.test(algebra)],
  ['trace ownership remains domain-phase based', /invocationWitnessOwnerRuleId\(witness\)/.test(algebra) && /case 'argument-binding': return 'invocation-positional-argument-binding'/.test(contract)],
  ['scanner continues to delegate through invocation runtime executor', /invocationSemanticRuntimeExecutor\.executeAll\(/.test(scanner)],
  ['ambiguous target test asserts aggregate target judgment', /outcome: 'ambiguous',[\s\S]*?targets: expect\.arrayContaining/.test(tests)],
];
let failed = 0;
for (const [name, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed ? 1 : 0;
