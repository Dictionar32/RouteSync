const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const indexPath = path.join(root, 'packages/core/src/index.ts');
const source = fs.readFileSync(interfacePath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const checks = [
  ['decision contract is indexed by rule family', /export type QueryOperationSemanticDecisionFor<Rule extends QueryOperationSemanticRuleFamily>/.test(source) && /\[Rule in QueryOperationSemanticRuleFamily\]: QueryOperationSemanticDecisionFor<Rule>/.test(source)],
  ['family-indexed contract declaration is retained', /readonly contract: QueryOperationSemanticRuleDeclarationFor<Rule>/.test(source)],
  ['resolved conclusion family is correlated with the rule', /readonly conclusion: Readonly<\{ readonly kind: 'query_operation_ast'; readonly family: Rule \}>/.test(source)],
  ['derivation is indexed by rule family', /export type QueryOperationSemanticDerivationFor<Rule extends QueryOperationSemanticRuleFamily>/.test(source) && /\[Rule in QueryOperationSemanticRuleFamily\]: QueryOperationSemanticDerivationFor<Rule>/.test(source)],
  ['public package exports correlated interface types', /QueryOperationSemanticDerivationFor, QueryOperationSemanticDerivation, QueryOperationSemanticDecisionFor, QueryOperationSemanticDecision/.test(index)],
  ['scanner and executor implementations are outside this interface-only phase', fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/queryEvidenceProducer.ts')) && fs.existsSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts'))],
];
let failures = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failures += 1;
}
process.exitCode = failures === 0 ? 0 : 1;
