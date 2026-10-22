const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/phpTypeExpressionInterface.ts');
const algebra = read('packages/core/src/types/upstream/phpTypeExpressionAlgebra.ts');
const producer = read('packages/core/src/compiler/scanner/operations/propertyProducer.ts');
const tests = read('packages/core/src/types/upstream/__test__/phpTypeExpressionContract.phase1476.test.ts');
const checks = [
  ['closed resolved/unsupported/malformed interface judgment', contract.includes("kind: 'resolved'") && contract.includes("kind: 'unsupported'") && contract.includes("kind: 'malformed'")],
  ['upstream algebra owns PHP type grammar', algebra.includes('const parse = (source: string, classContext?') && algebra.includes('phpTypeExpressionAlgebra')],
  ['property producer delegates to upstream algebra', producer.includes('phpTypeExpressionAlgebra.resolve({ source: raw })')],
  ['runtime consumer only projects the judgment', !producer.includes('const parseTypeExpression') && !producer.includes('const splitTopLevel')],
  ['explicit DNF parenthesization is enforced', algebra.includes('must be parenthesized as DNF')],
  ['intersection containing union fails closed', algebra.includes('intersection containing a union must be rewritten as DNF')],
  ['nullable-prefix composition fails closed', algebra.includes('Nullable prefix cannot be combined directly')],
  ['unsupported atoms delegate to shared atom authority', algebra.includes('phpTypeAtomAlgebra.resolve({ source, classContext })') && algebra.includes("judgment.kind === 'unsupported'")],
  ['tests cover invalid precedence and nullable composition', tests.includes("resolve('Customer|Invoice&Countable')") && tests.includes("resolve('?Customer|Invoice')")],
  ['tests distinguish missing vocabulary from contextual atoms', tests.includes("'missing_vocabulary'") && tests.includes("'context_required'")],
];
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
console.log(`Phase 1476 audit: ${checks.filter(([, pass]) => pass).length}/${checks.length} PASS`);
