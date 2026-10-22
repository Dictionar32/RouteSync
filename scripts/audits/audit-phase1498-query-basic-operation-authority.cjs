const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const algebra = read('packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts');
const checks = [
  ['interface declares closed basic-operation authority', /resolveQueryBasicOperation:\s*\(methodName: string, arguments_: readonly Expression\[\]\) => QueryProducerSemanticJudgment<QueryOperationAst>/.test(iface)],
  ['algebra owns where-family names and operation construction', /const resolveQueryBasicOperation/.test(algebra) && /methodName === 'where'/.test(algebra) && /methodName === 'orWhereNot'/.test(algebra)],
  ['algebra preserves malformed where evidence', /where field must be a string literal/.test(algebra) && /requires a value argument/.test(algebra)],
  ['scanner delegates basic operation meaning upstream', /queryProducerSemanticAlgebra\.resolveQueryBasicOperation\(name, args\)/.test(scanner)],
  ['scanner judgment channel preserves malformed basic operations', /queryProducerSemanticAlgebra\.resolveQueryBasicOperation\(operation\.name\.value\.value, positionalArguments\(expression\)\)/.test(scanner) && /if \(basicJudgment\.kind !== 'not_applicable'\) return basicJudgment/.test(scanner)],
  ['local where and whereNot semantic rules removed', !/relationRuleEntries\(\['whereNot', 'orWhereNot'\]/.test(scanner) && !/relationRuleEntries\(\['where', 'orWhere'\]/.test(scanner)],
  ['legacy query operation projection remains downstream-compatible', /const operationFromExpression/.test(scanner) && /queryChainOperationJudgments/.test(scanner)],
];
let failed = false;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed ||= !passed;
}
process.exitCode = failed ? 1 : 0;
