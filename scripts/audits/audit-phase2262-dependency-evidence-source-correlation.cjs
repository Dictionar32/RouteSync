const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const resolverPath = path.join(root, 'packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const resolver = fs.readFileSync(resolverPath, 'utf8');
const checks = [
  ['constructor dependency projection receives source identity', /resolveConstructorDependencies\(constructorParameters,[\s\S]*?sourceFile\)/.test(resolver)],
  ['method dependency projection receives source identity', /resolveMethodDependencies\(method\.parameters,[\s\S]*?sourceFile\)/.test(resolver)],
  ['constructor dependency boundary types source identity', /function resolveConstructorDependencies\([\s\S]*?sourceFile: SourceFile/.test(resolver)],
  ['method dependency boundary types source identity', /function resolveMethodDependencies\([\s\S]*?sourceFile: SourceFile/.test(resolver)],
  ['dependency evidence composer types source identity', /function dependencySemanticInput\([\s\S]*?sourceFile: SourceFile/.test(resolver)],
  ['attribute expression projection consumes SourceFile', /expressionArgumentsFromParameterAttribute\(attribute, sourceFile\)/.test(resolver)],
  ['expression projection reads the source identity from the branded SourceFile', /function expressionArgumentsFromParameterAttribute\([\s\S]*?const file = sourceFile\.value\.value/.test(resolver)],
  ['synthetic controller-parameter source label is retired', !resolver.includes("'<controller-parameter>'")],
  ['resolver has no foundation or relations imports', !/semantic\/(?:foundation|relations)/.test(resolver)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failures = checks.filter(([, passed]) => !passed);
console.log(`${checks.length - failures.length}/${checks.length} checks passed`);
process.exitCode = failures.length === 0 ? 0 : 1;
