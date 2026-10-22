const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const iface = read('packages/core/src/types/upstream/scannerCallableListInterface.ts');
const algebra = read('packages/core/src/types/upstream/scannerCallableListAlgebra.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const tests = read('packages/core/src/types/upstream/__test__/scannerCallableParameterTypeContract.phase1473.test.ts');
const checks = [
  ['parameter type evidence is a closed union', iface.includes('CallableParameterTypeEvidence<Token>') && iface.includes("kind: 'primitive'") && iface.includes("kind: 'named'") && iface.includes("kind: 'nullable'")],
  ['type reasoning is owned by upstream algebra', algebra.includes('resolveParameterType') && algebra.includes('supported parameter type (primitive, named, or nullable)')],
  ['primitive type evidence is preserved', algebra.includes('primitiveParameterTypes') && algebra.includes("kind: 'primitive', name: primitive")],
  ['nullable type evidence is preserved', algebra.includes("kind: 'nullable', inner")],
  ['unsupported type evidence fails closed', algebra.includes('return { malformed: malformedAt(tokens')],
  ['runtime projects upstream type judgment', runtime.includes('projectCallableParameterType(parameter.typeEvidence)')],
  ['runtime no longer forces all parameter types absent', !runtime.includes("type: { kind: 'absent' as const }" )],
  ['tests cover nullable and unsupported union types', tests.includes('preserves primitive and nullable named type evidence') && tests.includes('rejects unsupported union type evidence')],
  ['public upstream interface export retained', read('packages/core/src/types/upstream/index.ts').includes("export * from './scannerCallableListInterface'")],
];
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
