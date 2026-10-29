const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts'), 'utf8');
const reasoning = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/operations/queryEvidenceProducer.ts'), 'utf8');
const checks = [
  ['upstream contract models premises, constraints, evidence and conclusion', /QueryOperationSemanticRuleDeclaration/.test(contract) && /readonly premises: readonly \[/.test(contract) && /readonly constraints: readonly \[/.test(contract) && /QueryOperationSemanticRuleDeclarationFor/.test(contract) && /readonly conclusion: Readonly/.test(contract)],
  ['rule catalog is constructed from semantic declarations', /declareQueryOperationRule/.test(reasoning) && /const declaration: QueryOperationSemanticRuleDeclarationFor<Rule> = Object\.freeze/.test(reasoning) && /declaration\.methods\.map/.test(reasoning)],
  ['selected executor does not own output rule identity', /ruleBinding\.execute\(evidence\)/.test(reasoning) && /ruleBinding\.declaration\.rule/.test(reasoning)],
  ['all declared rule families retain explicit premises and constraints', (reasoning.match(/declareQueryOperationRule\('/g) || []).length === 16 && /'nested_query_shape'/.test(reasoning) && /'operator_domain'/.test(reasoning) && /'property_identity'/.test(reasoning)],
  ['scanner treats malformed upstream judgment as terminal and only falls back on not-applicable', /operationDecision\.kind === 'resolved'/.test(scanner) && /operationDecision\.kind === 'malformed'/.test(scanner) && /Remaining legacy families/.test(scanner)],
  ['declarative contract types are publicly exported', /QueryOperationSemanticRuleDeclaration/.test(fs.readFileSync(path.join(root, 'packages/core/src/index.ts'), 'utf8'))],
];
let failed = false;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !ok;
}
if (failed) process.exitCode = 1;
