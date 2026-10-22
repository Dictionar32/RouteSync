const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const resolverPath = path.join(root, 'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const wiringPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const testPath = path.join(root, 'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.phase10.test.ts');
const resolver = fs.readFileSync(resolverPath, 'utf8');
const wiring = fs.readFileSync(wiringPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const resolverStart = resolver.indexOf('export function resolveControllerActionContract(');
const resolverEnd = resolver.indexOf('\nexport function resolveControllerDependencyProducts(', resolverStart);
const body = resolver.slice(resolverStart, resolverEnd);
const checks = [
  ['resolver context accepts the canonical upstream dataflow judgment', /readonly dataflowJudgment: ControllerDataflowSemanticJudgment<ControllerDataflowDefinitionPayloadMetadata>/.test(resolver)],
  ['semantic variables are projected from the closed judgment', /semantic:\s*context\.dataflowJudgment\.semanticVariables/.test(body)],
  ['published dataflow judgment is the exact supplied judgment', /dataflowJudgment:\s*context\.dataflowJudgment/.test(body)],
  ['resolver does not read semantic variables from body judgment', !/bodyJudgment\.dataflow\.semanticVariables/.test(body)],
  ['resolver does not replace the closed judgment with method AST dataflow', !/dataflowJudgment:\s*method\.body\.dataflow/.test(body)],
  ['production composition supplies the existing parsed canonical judgment', /dataflowJudgment:\s*input\.method\.body\.dataflow/.test(wiring)],
  ['resolver test fixture supplies the same canonical judgment input', /dataflowJudgment:\s*method\.body\.dataflow/.test(test)],
  ['no forbidden semantic foundation dependency was introduced', !/semantic\/foundation/.test(resolver + wiring + test)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
