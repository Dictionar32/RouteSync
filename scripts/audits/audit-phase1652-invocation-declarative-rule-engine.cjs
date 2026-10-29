const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts');
const algebra = read('packages/core/src/types/upstream/invocationSemanticJudgmentAlgebra.ts');
const authority = read('packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const scannerTest = read('packages/core/src/compiler/scanner/__test__/ecommerceShopDataflowPhase104.spec.ts');
const boundaryFiles = [contract, algebra, authority, executor, scanner];
const executableIds = [...contract.matchAll(/invocationExecutionRule\('([^']+)'/g)].map(match => match[1]);
const listedIdsBlock = contract.match(/INVOCATION_SEMANTIC_EXECUTION_RULE_IDS[^=]*= Object\.freeze\(\[([\s\S]*?)\]\);/);
const listedIds = listedIdsBlock ? [...listedIdsBlock[1].matchAll(/'([^']+)'/g)].map(match => match[1]) : [];
const checks = [
  ['contract version 9 owns executable invocation rule IDs and high-level rule policies', /version: 9;/.test(contract) && /executableRuleIds: readonly InvocationSemanticExecutionRuleId\[\]/.test(contract)],
  ['interface declares executable rules as relation programs', /INVOCATION_SEMANTIC_EXECUTION_RULES/.test(contract) && /invocationExecutionRule\('invocation-target-resolution'/.test(contract) && /invocationExecutionRule\('invocation-target-ambiguity'/.test(contract)],
  ['trace rule ID catalog exactly matches executable rule catalog', executableIds.length === listedIds.length && executableIds.every((id, index) => id === listedIds[index])],
  ['target, argument, result, exception, ambiguity and unresolved semantics have declared derivation rules', ['invocation-evidence-presence', 'invocation-target-resolution', 'invocation-target-ambiguity', 'invocation-positional-argument-binding', 'invocation-argument-parameter-unresolved', 'invocation-result-emission', 'invocation-exception-emission', 'invocation-unresolved-target-obligation'].every(id => contract.includes(`'${id}'`))],
  ['algebra compiles interface-owned rules into generic relation execution', /compileSemanticJudgmentRule\(rule\)/.test(algebra) && /rules: invocationRuleProgram/.test(algebra) && /executeRelations\(/.test(algebra)],
  ['algebra no longer contains imperative target ambiguity, argument binding or emission decisions', !/targets\.length\s*>\s*1|parameterIndex\s*=|argumentWithoutParameter\s*!==|emissionFlows\s*=\s*\(/.test(algebra)],
  ['trace applications are selected from actual solver derivations', /state\.judgment\.derivations\.filter\(derivation =>/.test(algebra) && /Concrete premise witnesses, bindings, and conclusions/.test(contract)],
  ['dependency slice excludes unrelated callable and emission knowledge before derivation', /requestedKeys\.has\(key\(flow\.source\)\)/.test(algebra) && /targetKeys\.has\(key\(callable\.id\)\)/.test(algebra) && /emissionKeys\.has\(key\(emission\.id\)\)/.test(algebra)],
  ['authority validates the full executable trace catalog and proof obligations', /INVOCATION_SEMANTIC_CONTRACT\.executableRuleIds/.test(authority) && /rule trace does not cover every declared rule/.test(authority) && /closed judgment has incomplete rewrite proof/.test(authority)],
  ['runtime executor delegates single and batch calls only', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor) && /executeAll: batchAuthority\.analyze/.test(executor)],
  ['production scanner calls the executor and contains no invocation policy', /invocationSemanticRuntimeExecutor\.executeAll\(semanticKnowledgeDataFlow\)/.test(scanner) && !/callable_target_unresolved|callable_target_ambiguous|invocation-positional-argument-binding|invocation-target-resolution/.test(scanner)],
  ['scanner test checks rule catalog and a real unresolved-target derivation witness', /INVOCATION_SEMANTIC_EXECUTION_RULE_IDS/.test(scannerTest) && /invocation-unresolved-target-obligation/.test(scannerTest) && /applications\)\.toHaveLength\(1\)/.test(scannerTest)],
  ['high-level rule policy catalog owns trace evidence projections and obligation ownership', /INVOCATION_SEMANTIC_RULE_POLICIES/.test(contract) && /rulePolicies: INVOCATION_SEMANTIC_RULE_POLICIES/.test(contract) && /obligationPolicies: INVOCATION_SEMANTIC_OBLIGATION_POLICIES/.test(contract) && /invocationSemanticRulePolicy\(ruleId\)/.test(algebra)],
  ['algebra selects evidence and obligation ownership from policy, not rule-ID switches', !/switch \(ruleId\)/.test(algebra) && /projectInvocationEvidence\[projection\]/.test(algebra) && /policy.obligations.includes\(obligation.kind\)/.test(algebra)],
  ['no invocation-boundary file imports semantic foundation', !boundaryFiles.some(source => /semantic\/foundation/.test(source))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
