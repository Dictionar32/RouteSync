const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const model = read('src/types/upstream/resourceModelBindingSemanticInterface.ts');
const judgment = read('src/types/upstream/laravelScannerSemanticJudgment.ts');
const authority = read('src/compiler/semantic/resourceModelBindingAuthority.ts');
const scannerContract = read('src/types/upstream/laravelResourceScannerInterface.ts');
const scanner = read('src/compiler/scanner/wiring/laravelResourceScanner.ts');
const index = read('src/index.ts');
const checks = [
  ['candidate cardinality is a closed ADT with empty, singleton, and multiple-candidate variants', /type ResourceModelBindingCandidateCardinality\s*=\s*[\s\S]*?kind: 'no_candidate'[\s\S]*?kind: 'one_candidate'[\s\S]*?kind: 'multiple_candidates'/.test(model)],
  ['outcome formation is a named upstream semantic model rather than untyped descriptive fields', /interface ResourceModelBindingOutcomeFormationModelInterface[\s\S]*?readonly noCandidate[\s\S]*?readonly oneCandidate[\s\S]*?readonly multipleCandidates/.test(model) && /readonly outcomeFormation: ResourceModelBindingOutcomeFormationModelInterface/.test(model)],
  ['canonical judgment model owns the outcome formation model and closure model at version 5', /contractVersion: 5/.test(model) && /outcomeFormation: RESOURCE_MODEL_BINDING_OUTCOME_FORMATION_MODEL/.test(model) && /batchClosure: RESOURCE_MODEL_BINDING_BATCH_CLOSURE_MODEL/.test(model)],
  ['authority interface exposes the exact semantic model and rewrite rule set it realizes', /interface ResourceModelBindingJudgmentAuthority[\s\S]*?contractVersion: 4[\s\S]*?semanticModel: ResourceModelBindingSemanticJudgmentModelInterface[\s\S]*?closureModel: ResourceModelBindingBatchClosureModelInterface[\s\S]*?ruleSet: ResourceModelBindingSemanticRuleSetInterface/.test(judgment)],
  ['canonical authority binds the upstream model and rule set instead of maintaining a parallel policy', /semanticModel: RESOURCE_MODEL_BINDING_SEMANTIC_JUDGMENT_MODEL/.test(authority) && /ruleSet: RESOURCE_MODEL_BINDING_SEMANTIC_RULE_SET/.test(authority)],
  ['outcome construction consumes the candidate-cardinality ADT through semantic variant elimination', /closeCandidateCardinality[\s\S]*?kind: 'no_candidate'[\s\S]*?kind: 'one_candidate'[\s\S]*?kind: 'multiple_candidates/.test(authority) && /relationVariantFold\([\s\S]*?cardinality,[\s\S]*?'one_candidate'/.test(authority) && !/candidates\.length === 0|candidates\.length === 1/.test(authority)],
  ['source evidence and invocation-integrated controller judgment remain in the same closed response', /readonly controllerScan: LaravelControllerScanJudgment/.test(scannerContract) && /readonly response: LaravelResourceIntegratedResponse/.test(scannerContract) && /controllerScan: input\.controllerScan/.test(scanner)],
  ['resource AST projection still consumes subject-correlated judgments after batch closure', /bindingAuthority\.judgeBatch/.test(scanner) && /binding\.subject === subjectEntry\.subject/.test(scanner) && /bindingBatch\.closure/.test(scanner)],
  ['public exports expose the stronger outcome and closure algebras', /ResourceModelBindingOutcomeFormationModelInterface/.test(index) && /ResourceModelBindingCandidateCardinality/.test(index) && /ResourceModelBindingBatchClosureModelInterface/.test(index) && /RESOURCE_MODEL_BINDING_OUTCOME_FORMATION_MODEL/.test(index) && /RESOURCE_MODEL_BINDING_BATCH_CLOSURE_MODEL/.test(index)],
  ['scanner contract is versioned for the stronger semantic authority model', /readonly contractVersion: 17/.test(scannerContract) && /contractVersion: 17/.test(scanner)],
  ['no semantic foundation dependency was reintroduced', !/semantic\/foundation/.test(model + judgment + authority + scannerContract + scanner)],
];
let failed = false;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !ok;
}
process.exitCode = failed ? 1 : 0;
