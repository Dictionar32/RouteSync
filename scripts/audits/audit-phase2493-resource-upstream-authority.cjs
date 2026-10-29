const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const targets = [
  'packages/core/src/compiler/scanner/operations/resourceProducer.ts',
  'packages/core/src/compiler/scanner/operations/resourceFieldProducer.ts',
  'packages/core/src/compiler/scanner/operations/resourceAstExpressionMapper.ts',
  'packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts',
  'packages/core/src/compiler/frontend/php/resourceSourceEvidence.ts',
];
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const assertions = [
  ['existing producer contract is upstream-owned', () => /export interface ResourceProducerInterface/.test(read('packages/core/src/types/upstream/resourceProducerInterface.ts'))],
  ['canonical scanner still imports producer from operations (open frontier)', () => /from ['"]\.\.\/operations\/resourceProducer['"]/.test(read('packages/core/src/compiler/scanner/wiring/laravelResourceScanner.ts'))],
  ['legacy binder directly imports the producer (open frontier)', () => /from ['"]\.\.\/\.\.\/operations\/resourceProducer['"]/.test(read('packages/core/src/compiler/scanner/binders/resource/resourceBinder.ts'))],
  ['source evidence contract exists upstream', () => /interface ResourceSourceEvidenceScannerInterface/.test(read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts'))],
  ['resource semantic mapping contract exists upstream', () => /interface ResourceSemanticMappingAuthorityInterface/.test(read('packages/core/src/types/upstream/resourceSemanticMappingInterface.ts'))],
  ...targets.map((file) => [`${file} still has relation dependency (open frontier)`, () => /semantic\/relations/.test(read(file))]),
];
let passed = 0;
for (const [label, assertion] of assertions) {
  const ok = assertion();
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${label}\n`);
  passed += Number(ok);
}
process.stdout.write(`\nResult: ${passed}/${assertions.length} trace assertions passed\n`);
process.stdout.write('PASS means the recorded code fact was observed; “open frontier” checks intentionally confirm unresolved debt, not architectural success.\n');
if (passed !== assertions.length) process.exitCode = 1;
