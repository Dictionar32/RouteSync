const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['atom interface defines closed judgment', /PhpTypeAtomJudgment[\s\S]*kind: 'resolved'[\s\S]*kind: 'malformed'/.test(read('packages/core/src/types/upstream/phpTypeAtomInterface.ts'))],
  ['atom algebra owns primitive mapping', /primitiveKinds[\s\S]*string: 'string'[\s\S]*array: 'json'/.test(read('packages/core/src/types/upstream/phpTypeAtomAlgebra.ts'))],
  ['expression grammar delegates atom interpretation', /phpTypeAtomAlgebra\.resolve\(\{ source, classContext \}\)/.test(read('packages/core/src/types/upstream/phpTypeExpressionAlgebra.ts'))],
  ['parameter algebra delegates primitive interpretation', /phpTypeAtomAlgebra\.resolve\(\{ source: evidence\.name, classContext \}\)/.test(read('packages/core/src/types/upstream/phpParameterTypeAlgebra.ts'))],
  ['old local contextual atom table removed', !/unsupportedNativeAtoms/.test(read('packages/core/src/types/upstream/phpTypeExpressionAlgebra.ts'))],
  ['public upstream barrel exports atom contract', /export \{ phpTypeAtomAlgebra \}/.test(read('packages/core/src/types/upstream/index.ts')) && /PhpTypeAtomInterface/.test(read('packages/core/src/types/upstream/index.ts'))],
  ['regression tests cover agreement and fail-closed cases', /shares one atom judgment[\s\S]*fails closed/.test(read('packages/core/src/types/upstream/__test__/php-type-atom-authority.phase1479.test.ts'))],
];
let failures = 0;
for (const [label, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!pass) failures += 1;
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
