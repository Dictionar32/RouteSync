const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const reasoningPath = path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/operations/queryEvidenceProducer.ts');
const source = fs.readFileSync(interfacePath, 'utf8');
const reasoning = fs.readFileSync(reasoningPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const checks = [
  ['resolved provenance judgment carries the actual QueryOperationAst', /QueryOperationSemanticProvenanceJudgmentFor<Rule extends QueryOperationSemanticRuleFamily>[\s\S]*kind: 'resolved'[\s\S]*conclusion: Readonly<[\s\S]*kind: 'query_operation_ast'[\s\S]*family: Rule[\s\S]*operation: QueryOperationAst/.test(source)],
  ['resolved outcome still requires a fully satisfied obligation ledger', /kind: 'resolved'[\s\S]*obligations: QueryOperationSemanticSatisfiedObligationLedgerFor<Rule>/.test(source)],
  ['malformed and undetermined remain distinct closed outcomes', /kind: 'malformed'[\s\S]*obligations: QueryOperationSemanticEvaluatedObligationLedgerFor<Rule>[\s\S]*kind: 'undetermined'[\s\S]*obligations: QueryOperationSemanticObligationLedgerFor<Rule>/.test(source)],
  ['execution plan output remains correlated to the selected rule family', /QueryOperationSemanticOwnedExecutionPlanFor<Rule extends QueryOperationSemanticRuleFamily>[\s\S]*evidence: QueryOperationSemanticSourceEvidence[\s\S]*execute: \(\) => QueryOperationSemanticProvenanceJudgmentFor<Rule>/.test(source)],
  ['semantic reasoning implementation has not been rewritten in this interface-only phase', /queryOperationRuleCatalog/.test(reasoning)],
  ['scanner still delegates to upstream resolver and remains an explicit migration frontier', /resolveQueryOperation\(/.test(scanner) && /Remaining legacy families are an explicit migration frontier/.test(scanner)],
];
let failures = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failures += 1;
}
process.exitCode = failures === 0 ? 0 : 1;
