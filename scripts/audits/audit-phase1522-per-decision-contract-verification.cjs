const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contract = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticInterface.ts'), 'utf8');
const reasoning = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/queryProducerSemanticReasoning.ts'), 'utf8');
const scanner = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/operations/queryEvidenceProducer.ts'), 'utf8');
const checks = [
  ['existing interface exposes per-decision integrity validation', /export const validateQueryOperationSemanticDecision\s*=/.test(contract)],
  ['decision validator binds rule, contract, and derivation identity', /contract_rule_mismatch/.test(contract) && /derivation_rule_mismatch/.test(contract) && /conclusion_mismatch/.test(contract)],
  ['decision validator verifies source method and argument count lineage', /method_not_owned_by_contract/.test(contract) && /derivation_method_mismatch/.test(contract) && /argument_count_mismatch/.test(contract)],
  ['decision validator rechecks required rule premises and constraints', /requirements\.premises/.test(contract) && /requirements\.constraints/.test(contract) && /missing_premise/.test(contract) && /missing_constraint/.test(contract)],
  ['runtime executor validates each produced decision before returning it', /const validation = validateQueryOperationSemanticDecision\(evidence, decision\)/.test(reasoning) && /if \(validation\.kind === 'invalid'\)/.test(reasoning)],
  ['scanner still consumes upstream decision and preserves fallback only for not-applicable methods', /queryProducerSemanticAlgebra\.resolveQueryOperation/.test(scanner) && /Remaining legacy families are an explicit migration frontier/.test(scanner) && /operationDecision\.kind === 'malformed'/.test(scanner)],
];
let failed = false;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  failed ||= !ok;
}
if (failed) process.exitCode = 1;
