const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const resolverPath = path.join(root, 'packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const testPath = path.join(root, 'packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.phase10.test.ts');
const resolver = fs.readFileSync(resolverPath, 'utf8');
const tests = fs.readFileSync(testPath, 'utf8');
const checks = [
  ['constructor parameter inventory is required', /readonly constructorParameters: readonly ControllerParameterAst\[\];/.test(resolver)],
  ['contextual attribute inventory is required', /readonly customContextualAttributeNames: readonly string\[\];/.test(resolver)],
  ['constructor fallback removed', !/context\.constructorParameters \?\?/.test(resolver)],
  ['contextual attribute fallback removed', !/context\.customContextualAttributeNames \?\?/.test(resolver)],
  ['resolver consumes exact constructor inventory', /resolveConstructorDependencies\(context\.constructorParameters, context\.customContextualAttributeNames/.test(resolver)],
  ['resolver consumes exact method inventory', /resolveMethodDependencies\(method\.parameters, context\.customContextualAttributeNames/.test(resolver)],
  ['tests provide explicit empty inventories', (tests.match(/customContextualAttributeNames: \[\]/g) || []).length === 4],
  ['edited resolver avoids forbidden semantic imports', !/semantic\/(?:foundation|relations)/.test(resolver)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
