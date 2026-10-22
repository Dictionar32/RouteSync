const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts'), 'utf8');
const reasoning = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts'), 'utf8');
const tests = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts'), 'utf8');
const index = fs.readFileSync(path.join(root, 'packages/core/src/index.ts'), 'utf8');
const checks = [
  ['upstream declares a closed catalog-integrity judgment', /QueryOperationSemanticRuleCatalogValidation/.test(contract) && /duplicate_method_claim/.test(contract) && /rule_conclusion_mismatch/.test(contract)],
  ['catalog validator rejects incomplete declarations and duplicate method ownership', /validateQueryOperationSemanticRuleCatalog/.test(contract) && /empty_rule_methods/.test(contract) && /missing_premise/.test(contract) && /missing_constraint/.test(contract)],
  ['semantic authority validates declarations before creating the dispatch index', /validateQueryOperationSemanticRuleCatalog\(/.test(reasoning) && /Invalid query semantic rule catalog/.test(reasoning) && /declaration\.methods\.map/.test(reasoning)],
  ['scanner derives compatibility evidence only after a legacy rule claims the method', /relationLookup\(queryNamedMethodOperationCatalog, name\)[\s\S]*resolver => resolver\(\{[\s\S]*field: propertyArgument\(args\[0\]\)/.test(scanner)],
  ['catalog integrity has tests for unique ownership, duplicate claims, and incomplete rules', /accepts complete declarations with unique method ownership/.test(tests) && /rejects a method claimed by multiple semantic rules/.test(tests) && /rejects declarations that omit premises or constraints/.test(tests)],
  ['catalog validation contract is exported from core', /export \{ validateQueryOperationSemanticRuleCatalog \}/.test(index) && /QueryOperationSemanticRuleCatalogValidation/.test(index)],
];
let failed = false;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !ok;
}
if (failed) process.exitCode = 1;
