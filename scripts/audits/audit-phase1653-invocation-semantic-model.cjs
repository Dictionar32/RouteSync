const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const algebra = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const authority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const policyBlock = contract.match(/const invocationSemanticRulePolicies[^=]*= \[([\s\S]*?)\];/);
const policyIds = policyBlock ? [...policyBlock[1].matchAll(/ruleId: '([^']+)'/g)].map(match => match[1]) : [];
const executableIds = [...contract.matchAll(/invocationExecutionRule\('([^']+)'/g)].map(match => match[1]);
const checks = [
  ['contract version 9 models invocation judgment policy as upstream-owned semantic data', /version: 9;/.test(contract) && /InvocationSemanticRulePolicy/.test(contract)],
  ['each executable rule has an explicit high-level evidence and obligation policy', executableIds.length === 8 && policyIds.length === 9 && executableIds.every(id => policyIds.includes(id)) && policyIds.includes('invocation-judgment-closure')],
  ['trace evidence projection is interpreted by semantic selector, not rule ID', /projectInvocationEvidence\[projection\]/.test(algebra) && !/switch \(ruleId\)/.test(algebra)],
  ['trace obligation ownership comes from declared policy', /policy\.obligations\.includes\(obligation\.kind\)/.test(algebra) && !/if \(ruleId === 'invocation-evidence-presence'\)/.test(algebra)],
  ['typed domain obligations are selected from interface-owned obligation policies', /INVOCATION_SEMANTIC_OBLIGATION_POLICIES/.test(contract) && /flatMap\(policy =>/.test(algebra) && /factRows\(state\.judgment, policy\.relation\)/.test(algebra)],
  ['trace applications are actual derivation witnesses', /state\.judgment\.derivations\.filter\(derivation =>/.test(algebra)],
  ['authority rejects judgments that violate identity, proof, closure, or trace contract', /assertInvocationSemanticJudgmentContract/.test(authority) && /closed judgment has incomplete rewrite proof/.test(authority)],
  ['executor only delegates to upstream authority', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor)],
  ['scanner calls executor without invocation-specific policy', /invocationSemanticRuntimeExecutor\.executeAll\(semanticKnowledgeDataFlow\)/.test(scanner) && !/callable_target_unresolved|callable_target_ambiguous|invocation-target-resolution/.test(scanner)],
  ['changed boundary does not import semantic foundation', ![contract, algebra, authority, executor, scanner].some(source => /semantic\/foundation/.test(source))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
