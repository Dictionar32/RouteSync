const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const algebra = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/resourceSemanticMappingAlgebra.ts'), 'utf8');
const authority = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/resourceSemanticMappingInterface.ts'), 'utf8');
const mapper = fs.readFileSync(path.join(root, 'packages/core/src/compiler/frontend/php/routeAst/phpAstExpressionMappings.ts'), 'utf8');
const test = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/__test__/resourceSemanticMappingAuthority.phase1635.test.ts'), 'utf8');

const checks = [
  ['interface accepts one typed input', /resolveStructuralKind:\s*\(input: ResourceStructuralMappingInput\)/.test(authority)],
  ['algebra accepts one typed input', /resolveResourceStructuralKind\s*=\s*\(\s*input: ResourceStructuralMappingInput,\s*\)/.test(algebra)],
  ['mapper uses object-form structural inputs', /resolveResourceStructuralKind\(\{\s*kind: 'argument', sourceKind: argument\.kind\s*\}\)/.test(mapper) && !/resolveResourceStructuralKind\('\w+',/.test(mapper)],
  ['authority test uses object-form input', /resolveStructuralKind\(\{\s*kind: 'argument', sourceKind: 'named'\s*\}\)/.test(test) && !/resolveStructuralKind\('argument',/.test(test)],
];

for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
}
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
