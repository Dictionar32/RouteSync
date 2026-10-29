const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/queryProducerSemanticInterface.ts');
const algebra = read('packages/core/src/types/upstream/queryProducerSemanticAlgebra.ts');
const scanner = read('packages/core/src/compiler/scanner/operations/queryEvidenceProducer.ts');
const checks = [
  ['interface declares closed join operation resolver', /resolveQueryJoinOperation:\s*\(methodName: string, arguments_: readonly Expression\[\]\) => QueryProducerSemanticJudgment<QueryOperationAst>/.test(contract)],
  ['algebra owns join name to canonical operation mapping', /const resolveQueryJoinOperation\s*=/.test(algebra) && /\['leftJoinLateral', 'left_join_lateral'\]/.test(algebra)],
  ['algebra delegates validation to upstream join judgment', /const join = resolveQueryJoin\(methodName, arguments_\)/.test(algebra)],
  ['scanner consumes upstream judgment', /queryProducerSemanticAlgebra\.resolveQueryJoinOperation\(name, args\)/.test(scanner)],
  ['scanner catalog no longer defines join variants', !/relationRuleEntries\(\['join'\]/.test(scanner) && !/relationRuleEntries\(\['leftJoin'\]/.test(scanner)],
];
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
