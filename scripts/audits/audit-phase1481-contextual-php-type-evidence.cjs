const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const atomInterface = read('packages/core/src/types/upstream/phpTypeAtomInterface.ts');
const atomAlgebra = read('packages/core/src/types/upstream/phpTypeAtomAlgebra.ts');
const expressionInterface = read('packages/core/src/types/upstream/phpTypeExpressionInterface.ts');
const expressionAlgebra = read('packages/core/src/types/upstream/phpTypeExpressionAlgebra.ts');
const parameterInterface = read('packages/core/src/types/upstream/phpParameterTypeInterface.ts');
const parameterAlgebra = read('packages/core/src/types/upstream/phpParameterTypeAlgebra.ts');
const tests = read('packages/core/src/types/upstream/__test__/php-type-atom-judgment.phase1480.test.ts');
const barrel = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['class-context evidence is typed and optional at atom boundary', /export type PhpTypeClassContext[\s\S]*enclosingClass\?: string[\s\S]*parentClass\?: string/.test(atomInterface) && /classContext\?: PhpTypeClassContext/.test(atomInterface)],
  ['self resolves only from enclosing-class evidence', /lowered === 'self'[\s\S]*context\?\.enclosingClass[\s\S]*context_required/.test(atomAlgebra)],
  ['parent resolves only from parent-class evidence', /lowered === 'parent'[\s\S]*context\?\.parentClass[\s\S]*context_required/.test(atomAlgebra)],
  ['late-static binding remains unsupported without dedicated target semantics', /lowered === 'static'[\s\S]*dedicated target representation/.test(atomAlgebra)],
  ['expression evidence carries context into recursive union/intersection/nullable parsing', /classContext\?: PhpTypeClassContext/.test(expressionInterface) && /parse\(evidence\.source, evidence\.classContext\)/.test(expressionAlgebra) && /parse\(member, classContext\)/.test(expressionAlgebra)],
  ['parameter evidence carries and propagates context through nullable types', /classContext\?: PhpTypeClassContext/.test(parameterInterface) && /evidence\.classContext \?\? inheritedContext/.test(parameterAlgebra) && /resolve\(evidence\.inner, classContext\)/.test(parameterAlgebra)],
  ['tests cover contextual class references and nullable parameter propagation', /enclosingClass: 'App\\\\Models\\\\Order'/.test(tests) && /parentClass: 'App\\\\Models\\\\BaseModel'/.test(tests) && /propagates class context through nullable parameter evidence/.test(tests)],
  ['public upstream barrel exports contextual evidence and algebra once', /PhpTypeClassContext/.test(barrel) && (barrel.match(/export \{ phpTypeAtomAlgebra \}/g) || []).length === 1],
];
let failures = 0;
for (const [label, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!pass) failures += 1;
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
