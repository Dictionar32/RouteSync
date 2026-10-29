const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts'), 'utf8');
const reasoning = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/operations/queryEvidenceProducer.ts'), 'utf8');
const tests = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts'), 'utf8');
const index = fs.readFileSync(path.join(root, 'packages/core/src/index.ts'), 'utf8');
const checks = [
  ['existing QueryProducerSemanticInterface owns immutable rule declarations', /interface QueryProducerSemanticInterface\s*\{[\s\S]*?readonly queryOperationRules:\s*readonly QueryOperationSemanticRuleDeclaration\[\]/.test(contract)],
  ['public rule model is derived once from upstream declarations', /export const queryOperationSemanticRules:[\s\S]*?queryOperationRuleCatalog\.map\(binding => binding\.declaration\)/.test(reasoning)],
  ['catalog validation and method dispatch use the same public rule model', /validateQueryOperationSemanticRuleCatalog\(\s*queryOperationSemanticRules\s*,?\s*\)/.test(reasoning) && /queryOperationRuleCatalog\.flatMap/.test(reasoning) && /binding\.declaration\.methods/.test(reasoning)],
  ['semantic authority exposes the same rule model it resolves against', /queryOperationRules:\s*queryOperationSemanticRules/.test(reasoning) && /resolveQueryOperation,/.test(reasoning)],
  ['scanner delegates claimed query operations to the upstream interface', /queryProducerSemanticAlgebra\.resolveQueryOperation/.test(scanner)],
  ['interface authority has a regression test', /interface-owned query semantic model/.test(tests) && /queryOperationRules/.test(tests)],
  ['existing core public surface exports the rule model and authority type', /export \{ queryOperationSemanticRules \}/.test(index) && /QueryProducerSemanticInterface/.test(index)],
];
let failed = false;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !ok;
}
if (failed) process.exitCode = 1;
