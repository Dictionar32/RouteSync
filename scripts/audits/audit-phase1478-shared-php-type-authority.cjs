const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const parameterAlgebra = read('packages/core/src/types/upstream/phpParameterTypeAlgebra.ts');
const propertyAlgebra = read('packages/core/src/types/upstream/phpTypeExpressionAlgebra.ts');
const mappings = read('packages/core/src/compiler/scanner/operations/resource/resourceUpstreamExpressionMappings.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const tests = read('packages/core/src/types/upstream/__test__/php-parameter-type-algebra.phase1477.test.ts');
const checks = [
  ['parameter algebra delegates primitive semantics to shared PHP type algebra', parameterAlgebra.includes("phpTypeAtomAlgebra.resolve({ source: evidence.name, classContext })")],
  ['parameter algebra no longer owns a duplicate primitive mapping table', !parameterAlgebra.includes('const constructors:') && !parameterAlgebra.includes("array: () => ({ kind: 'primitive', value: { kind: 'unspecified' } })")],
  ['property type algebra remains the canonical primitive atom resolver', propertyAlgebra.includes('const resolveAtom =') && propertyAlgebra.includes('phpTypeAtomAlgebra.resolve')],
  ['scanner maps typed AST to evidence and delegates to parameter algebra', mappings.includes('phpParameterTypeAlgebra.resolve(toEvidence(type))')],
  ['upstream barrel exports the parameter algebra and its contract types', index.includes("export { phpParameterTypeAlgebra } from './phpParameterTypeAlgebra'") && index.includes('PhpParameterTypeEvidence')],
  ['regression test checks identical primitive judgments across source paths', tests.includes('shares canonical PHP primitive semantics') && tests.includes('expect(parameter).toEqual(property)')],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`Phase 1478 audit: ${checks.length - failures}/${checks.length} passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
