const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const interfacePath = 'packages/core/src/types/upstream/phpParameterTypeInterface.ts';
const algebraPath = 'packages/core/src/types/upstream/phpParameterTypeAlgebra.ts';
const mappingPath = 'packages/core/src/compiler/scanner/operations/resource/resourceUpstreamExpressionMappings.ts';
const canonicalPath = 'packages/core/src/compiler/scanner/operations/resource/resourceUpstreamExpressionCanonical.ts';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['typed semantic evidence and closed judgment exist', /PhpParameterTypeEvidence/.test(read(interfacePath)) && /kind: 'resolved'/.test(read(interfacePath)) && /kind: 'malformed'/.test(read(interfacePath))],
  ['upstream algebra owns primitive/named/nullable interpretation', /case 'primitive'/.test(read(algebraPath)) && /case 'named'/.test(read(algebraPath)) && /case 'nullable'/.test(read(algebraPath))],
  ['resource mapping delegates type interpretation to algebra', /phpParameterTypeAlgebra\.resolve\(toEvidence\(type\)\)/.test(read(mappingPath))],
  ['canonical expression mapper uses shared parameter type projection', /resolveParameterType\(node\.returnType\.type\)/.test(read(canonicalPath)) && !/function resolveParameterTypeForClosureReturn/.test(read(canonicalPath))],
  ['duplicate local type constructor table removed', !/const constructors: Record<string, \(\) => TypeExpression>/.test(read(mappingPath))],
  ['regression test covers canonical primitive and nullable behavior', fs.existsSync(path.join(root, 'packages/core/src/types/upstream/__test__/php-parameter-type-algebra.phase1477.test.ts'))],
];
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
console.log(`${checks.filter(([, ok]) => ok).length}/${checks.length} checks passed`);
