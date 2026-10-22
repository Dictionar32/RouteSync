const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const iface = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const reasoning = read('packages/core/src/types/upstream/queryProducerSemanticReasoning.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const index = read('packages/core/src/index.ts');
const tests = read('packages/core/src/types/upstream/__test__/queryProducerSemanticAlgebra.phase1487.test.ts');
const checks = [
  ['derivation is a closed outcome union over the semantic rule vocabulary', /export type QueryOperationSemanticDerivation\s*=\s*\| Readonly/s.test(iface) && /readonly rule: QueryOperationSemanticRuleFamily/.test(iface)],
  ['resolved derivation records AST conclusion family', /readonly outcome: 'resolved';\s*readonly conclusion: Readonly<\{ readonly kind: 'query_operation_ast'; readonly family: QueryOperationSemanticRuleFamily \}>/s.test(iface)],
  ['malformed derivation records diagnostic conclusion', /readonly outcome: 'malformed';\s*readonly conclusion: Readonly<\{ readonly kind: 'query_semantic_diagnostic' \}>/s.test(iface)],
  ['claimed decisions carry derivation lineage', /readonly kind: 'resolved';[\s\S]*?readonly derivation: Extract<QueryOperationSemanticDerivation, \{ readonly outcome: 'resolved' \}>/s.test(iface) && /readonly kind: 'malformed';[\s\S]*?readonly derivation: Extract<QueryOperationSemanticDerivation, \{ readonly outcome: 'malformed' \}>/s.test(iface)],
  ['authority derives lineage from actual evidence and outcome', /argumentCount: evidence\.arguments\.length/.test(reasoning) && /methodName: evidence\.methodName\.value\.value/.test(reasoning) && /outcome: 'resolved' as const/.test(reasoning) && /outcome: 'malformed' as const/.test(reasoning)],
  ['unknown operations remain unclaimed without invented derivation', /kind: 'not_applicable' as const,[\s\S]*?unclaimed_query_operation_rule/.test(reasoning) && !/kind: 'not_applicable',[\s\S]*?derivation/.test(reasoning)],
  ['scanner still projects upstream judgment', /queryProducerSemanticAlgebra\.resolveQueryOperation/.test(scanner) && /operationDecision\.kind === 'resolved'/.test(scanner)],
  ['derivation and decision contracts exported publicly', /QueryOperationSemanticDerivation/.test(index) && /QueryOperationSemanticDecision/.test(index) && /QueryOperationSemanticRule/.test(index)],
  ['tests assert resolved and malformed derivation lineage', /argumentCount: 3,[\s\S]*?outcome: 'resolved'/.test(tests) && /argumentCount: 1,[\s\S]*?outcome: 'malformed'/.test(tests)],
];
let failures = 0;
for (const [label, ok] of checks) {
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!ok) failures += 1;
}
process.exitCode = failures === 0 ? 0 : 1;
