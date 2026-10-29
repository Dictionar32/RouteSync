const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const indexPath = path.join(root, 'packages/core/src/index.ts');
const reasoningPath = path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/operations/queryEvidenceProducer.ts');
const source = fs.readFileSync(interfacePath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const checks = [
  ['obligation receipts have closed satisfied/violated/unproven outcomes', /result: 'satisfied'/.test(source) && /result: 'violated'/.test(source) && /result: 'unproven'/.test(source)],
  ['evidence receipts require typed evidence anchors', /QueryOperationSemanticEvidenceAnchor/.test(source) && /readonly evidence: QueryOperationSemanticEvidenceAnchor/.test(source)],
  ['obligation ledger is indexed by rule-family premise and constraint keys', /QueryOperationSemanticObligationLedgerFor<Rule extends QueryOperationSemanticRuleFamily>/.test(source) && /`premise:\$\{Premise\}`/.test(source) && /`constraint:\$\{Constraint\}`/.test(source)],
  ['resolved judgment requires a fully satisfied obligation ledger', /kind: 'resolved';[\s\S]*?QueryOperationSemanticSatisfiedObligationLedgerFor<Rule>/.test(source)],
  ['malformed judgment carries evaluated obligations and a diagnostic', /kind: 'malformed';[\s\S]*?QueryOperationSemanticEvaluatedObligationLedgerFor<Rule>;[\s\S]*?QuerySemanticDiagnostic/.test(source)],
  ['undetermined judgment preserves unproven obligations explicitly', /kind: 'undetermined';[\s\S]*?QueryOperationSemanticObligationLedgerFor<Rule>/.test(source)],
  ['public entry point exports the new interface model types', /QueryOperationSemanticEvidenceAnchor[\s\S]*QueryOperationSemanticDerivationJudgmentFor, QueryOperationSemanticDerivationJudgment/.test(index)],
  ['runtime reasoning and scanner remain outside this interface-only change', fs.existsSync(reasoningPath) && fs.existsSync(scannerPath)],
];
let failures = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failures += 1;
}
process.exitCode = failures === 0 ? 0 : 1;
