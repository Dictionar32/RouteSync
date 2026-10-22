const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const algebra = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts'), 'utf8');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts'), 'utf8');
const authority = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts'), 'utf8');
const witnessType = contract.split('export type InvocationSemanticDerivationWitness =')[1]?.split('export const invocationWitnessOwnerRuleId')[0] ?? '';
const checks = [
  ['generic add witness builder removed', !/const add\s*=/.test(algebra)],
  ['argument binding represented as an aggregate domain witness', /kind: 'argument-binding'[\s\S]*?bindings: readonly SemanticArgumentParameterFlow\[\]/.test(contract)],
  ['witness union has no generic ruleId field', !/readonly ruleId:/.test(witnessType)],
  ['witness union has no generic conclusion field', !/readonly conclusion:/.test(witnessType)],
  ['argument binding witness reuses canonical domain facts', /kind: 'argument-binding'[\s\S]*?bindings: slice\.bindings/.test(algebra) && !/slice\.bindings\.map\(binding\s*=>\s*\(\{[\s\S]{0,240}kind:\s*'argument-binding'/.test(algebra)],
  ['authority validates semantic phase ownership', /invocationWitnessOwnerRuleId\(witness\) !== entry\.ruleId/.test(authority)],
  ['contract version advanced', /readonly version: 19;/.test(contract) && /version: 19,/.test(contract)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
