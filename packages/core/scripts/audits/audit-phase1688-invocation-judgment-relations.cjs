const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const judgment = fs.readFileSync(path.join(root, 'src/types/upstream/invocationSemanticJudgmentInterface.ts'), 'utf8');
const pipeline = fs.readFileSync(path.join(root, 'src/types/upstream/invocationSemanticPipelineInterface.ts'), 'utf8');
const publicIndex = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const scanner = fs.readFileSync(path.join(root, 'src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts'), 'utf8');
const executor = fs.readFileSync(path.join(root, 'src/types/upstream/invocationSemanticRuntimeExecutor.ts'), 'utf8');

const rules = [
  'invocation-evidence-presence',
  'invocation-target-resolution',
  'invocation-target-ambiguity',
  'invocation-positional-argument-binding',
  'invocation-argument-form-evidence',
  'invocation-argument-parameter-unresolved',
  'invocation-result-emission',
  'invocation-exception-emission',
  'invocation-unresolved-target-obligation',
  'invocation-judgment-closure',
];
const checks = [
  ['rule relation catalog is mapped exhaustively from InvocationSemanticRuleId', /export type InvocationSemanticRuleJudgmentRelationCatalog\s*=\s*\{\s*readonly \[RuleId in InvocationSemanticRuleId\]: InvocationSemanticRuleJudgmentRelationFor<RuleId>/.test(judgment)],
  ['relation binds prerequisite, established fact, non-conclusion, obligation, witness and trace owner', ['prerequisite', 'establishedFact', 'nonConclusion', 'obligation', 'witness', 'tracePolicyOwner'].every(key => judgment.includes(`readonly ${key}:`))],
  ['all ten domain rules have explicit typed relations', rules.every(rule => judgment.includes(`'${rule}': Object.freeze({ ruleId: '${rule}'`))],
  ['relation catalog is part of the authoritative semantic model', /readonly ruleJudgmentRelations: InvocationSemanticRuleJudgmentRelationCatalog/.test(judgment) && /ruleJudgmentRelations: INVOCATION_SEMANTIC_RULE_JUDGMENT_RELATIONS/.test(judgment) && /readonly version: 20/.test(judgment) && /version: 20,/.test(judgment)],
  ['judgment contract advances to version 33', /readonly version: 35/.test(judgment) && /version: 35,/.test(judgment)],
  ['pipeline contract advances to version 10 and requires relation correlation', /readonly version: 12/.test(pipeline) && /version: 12,/.test(pipeline) && /judgmentRelationAuthority: 'rule-prerequisite-fact-obligation-witness-and-trace-ownership-must-correlate'/.test(pipeline)],
  ['public API exports the judgment relation catalog and domain types', /INVOCATION_SEMANTIC_RULE_JUDGMENT_RELATIONS/.test(publicIndex) && /InvocationSemanticRuleJudgmentRelationCatalog/.test(publicIndex) && /InvocationSemanticEstablishedFact/.test(publicIndex)],
  ['scanner remains on existing delegation path; this phase does not wire implementation', /invocationSemanticRuntimeExecutor\.executeAll\(semanticKnowledgeDataFlow\)/.test(scanner) && /executeAll: batchAuthority\.analyze/.test(executor)],
  ['no semantic foundation dependency was introduced', !/semantic\/foundation/.test(judgment + pipeline)],
  ['audit is registered in package scripts', packageJson.scripts['audit:phase1688-invocation-judgment-relations'] === 'node scripts/audits/audit-phase1688-invocation-judgment-relations.cjs'],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`\nPhase 1688: ${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
