const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const producer = read('packages/core/src/compiler/scanner/operations/propertyProducer.ts');
const algebra = read('packages/core/src/types/upstream/phpTypeExpressionAlgebra.ts');
const tests = read('packages/core/src/types/upstream/__test__/scannerPropertyTypePartition.phase1475.test.ts');
const checks = [
  ['runtime-local splitTopLevel removed', !producer.includes('const splitTopLevel')],
  ['property producer delegates semantic type parsing upstream', producer.includes('phpTypeExpressionAlgebra.resolve({ source: raw })')],
  ['upstream type algebra delegates delimiter partition to shared interface', algebra.includes('scannerTokenStructureInterface.partitionTopLevel')],
  ['malformed partition becomes malformed semantic judgment', algebra.includes("judgment.kind === 'malformed' ? undefined")],
  ['union partition uses shared structure contract', algebra.includes("split(normalized, '|')")],
  ['intersection partition uses shared structure contract', algebra.includes("split(normalized, '&')")],
  ['nested union/intersection cases covered', tests.includes("partition('(A&B)|C', '|')") && tests.includes("partition('A&(B|C)', '&')")],
  ['malformed delimiter case covered', tests.includes("partition('(A&B|C', '|')")],
];
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
console.log(`Phase 1475 audit: ${checks.filter(([, pass]) => pass).length}/${checks.length} PASS`);
