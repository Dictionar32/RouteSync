const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const parserPath = path.join(root, 'packages/core/src/compiler/scanner/lexer/controllerDeclarationParser.ts');
const testPath = path.join(root, 'packages/core/src/compiler/scanner/lexer/controllerMethodInventoryScope.phase2310.test.ts');
const parser = fs.readFileSync(parserPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const checks = [
  ['class body boundary is modeled as a closed judgment', parser.includes("kind: 'controller_class_body_complete'") && parser.includes("kind: 'controller_class_body_blocked'")],
  ['method enumeration is bounded by the matching class closing brace', parser.includes('collectFunctionIndexes(tokens, classBody.openIndex + 1, classBody.closeIndex, 0, [])')],
  ['nested brace depth is tracked during enumeration', parser.includes('findMatchingClassBrace') && parser.includes('nextDepth')],
  ['method enumeration no longer starts at file offset zero', !parser.includes('collectFunctionIndexes(tokens, 0, [])')],
  ['regression test covers nested named function and a second class', test.includes('nestedHelper') && test.includes('OtherController')],
  ['regression test covers unclosed class body', test.includes('no matching closing brace')],
  ['upstream constructor authority remains the shared consumer contract', fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/phpClassConstructorSelectionInterface.ts'), 'utf8').includes('PhpClassMethodDeclarationInventory<TMethod>')],
  ['no foundation dependency added to parser', !parser.includes('semantic/foundation')],
];
const failures = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failures.length}/${checks.length}\n`);
if (failures.length) process.exitCode = 1;
