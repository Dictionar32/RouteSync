const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const judgment = fs.readFileSync(path.join(root, 'src/types/upstream/invocationSemanticJudgmentInterface.ts'), 'utf8');
const pipeline = fs.readFileSync(path.join(root, 'src/types/upstream/invocationSemanticPipelineInterface.ts'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const executor = fs.readFileSync(path.join(root, 'src/types/upstream/invocationSemanticRuntimeExecutor.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts'), 'utf8');
const publicIndex = fs.readFileSync(path.join(root, 'src/index.ts'), 'utf8');

const checks = [
  ['rule meanings are a closed discriminated union', /export type InvocationSemanticRuleMeaningSignature\s*=/.test(judgment) && /readonly ruleId: 'invocation-evidence-presence'/.test(judgment) && /readonly ruleId: 'invocation-judgment-closure'/.test(judgment)],
  ['catalog is exhaustive over every semantic rule id', /export type InvocationSemanticRuleMeaningCatalog\s*=\s*\{\s*readonly \[RuleId in InvocationSemanticRuleId\]: Extract<InvocationSemanticRuleMeaningSignature, \{ readonly ruleId: RuleId \}>/.test(judgment)],
  ['each rule captures question, admissible evidence, established meaning, non-conclusion, obligation and witness', ['question', 'admissibleEvidence', 'establishedMeaning', 'nonConclusion', 'obligation', 'witness'].every(key => judgment.includes(`readonly ${key}:`))],
  ['result and exception effects have distinct semantic signatures', /readonly ruleId: 'invocation-result-emission'[\s\S]*?readonly witness: 'effect-projection-result'/.test(judgment) && /readonly ruleId: 'invocation-exception-emission'[\s\S]*?readonly witness: 'effect-projection-exception'/.test(judgment)],
  ['rule meaning catalog is part of the canonical invocation model', /readonly ruleMeanings: InvocationSemanticRuleMeaningCatalog/.test(judgment) && /ruleMeanings: INVOCATION_SEMANTIC_RULE_MEANING_SIGNATURES/.test(judgment) && /readonly version: 20/.test(judgment) && /version: 20,/.test(judgment)],
  ['judgment contract advances for the elevated semantic model', /readonly version: 35/.test(judgment) && /version: 35,/.test(judgment)],
  ['pipeline composes the new judgment model under version 9', /readonly version: 12/.test(pipeline) && /kind: 'invocation_semantic_pipeline_contract',\s*version: 12,/.test(pipeline)],
  ['runtime executor remains pure delegation and scanner still delegates aggregate analysis', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor) && /executeAll: batchAuthority\.analyze/.test(executor) && /invocationSemanticRuntimeExecutor\.executeAll\(semanticKnowledgeDataFlow\)/.test(scanner)],
  ['public API exposes the canonical rule-meaning model', /INVOCATION_SEMANTIC_RULE_MEANING_SIGNATURES/.test(publicIndex) && /InvocationSemanticRuleMeaningSignature/.test(publicIndex) && /InvocationSemanticRuleMeaningCatalog/.test(publicIndex)],
  ['audit is registered in the package scripts', packageJson.scripts['audit:phase1687-invocation-rule-meaning-model'] === 'node scripts/audits/audit-phase1687-invocation-rule-meaning-model.cjs'],
  ['no semantic-foundation dependency was introduced', !/semantic\/foundation/.test(judgment + pipeline)],
];

let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`\nPhase 1687: ${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
