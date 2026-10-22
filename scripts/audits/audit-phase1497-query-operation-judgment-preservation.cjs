const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const query = read('packages/core/src/types/upstream/query.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const interfaceSource = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const checks = [
  ['query AST carries authoritative operation judgments', /readonly operationJudgments:\s*Sequence<QueryProducerSemanticJudgment<QueryOperationAst>>/.test(query)],
  ['judgment union preserves malformed outcomes', /readonly kind: 'malformed'; readonly diagnostic: string/.test(interfaceSource)],
  ['scanner resolves join meaning through upstream interface', /queryProducerSemanticAlgebra\.resolveQueryJoinOperation\(operation\.name\.value\.value, positionalArguments\(expression\)\)/.test(producer)],
  ['scanner preserves malformed/resolved/not-applicable judgments', /queryChainOperationJudgments/.test(producer) && /queryChainOperationJudgmentSequence/.test(producer) && /joinJudgment\.kind !== 'not_applicable'/.test(producer) && /basicJudgment\.kind !== 'not_applicable'/.test(producer)],
  ['legacy operations are projected only from resolved judgments', /judgment => judgment\.kind === 'resolved' \? \[judgment\.value\] : \[\]/.test(producer)],
  ['query and subquery construction both attach judgments', (producer.match(/operationJudgments: queryChainOperationJudgmentSequence/g) ?? []).length === 2],
  ['malformed operation roots are retained instead of filtered as absent', /return judgment\.kind === 'not_applicable' \? \[]/.test(producer) && /return judgment\.kind === 'not_applicable' \? nested/.test(producer)],
];
let failed = false;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed ||= !passed;
}
process.exitCode = failed ? 1 : 0;
