const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const iface = read('packages/core/src/types/upstream/scannerCallableListInterface.ts');
const algebra = read('packages/core/src/types/upstream/scannerCallableListAlgebra.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const checks = [
  ['parameter evidence is typed', iface.includes('CallableParameterEvidence<Token>') && iface.includes('CallableParameterJudgment<Token>')],
  ['argument evidence is a closed union', iface.includes("kind: 'positional'") && iface.includes("kind: 'named'") && iface.includes("kind: 'unpacked'")],
  ['parameter grammar belongs to algebra', algebra.includes('resolveParameters') && algebra.includes('exactly one parameter variable')],
  ['argument classification belongs to algebra', algebra.includes('resolveArgument') && algebra.includes('expression after ...')],
  ['parameter runtime consumes judgment', runtime.includes('scannerCallableListContractAlgebra.resolveParameters')],
  ['argument runtime consumes judgment', runtime.includes('scannerCallableListContractAlgebra.resolveArgument')],
  ['legacy variable-only parameter projection removed', !runtime.includes("relationSelect(tokens, token => relationEqual(token.type, 'VARIABLE'))")],
  ['legacy argument classifier removed', !runtime.includes("relationGate(relationEqual(tokenKindOr(tokens, 0, 'EOF'), 'ELLIPSIS')")],
  ['public upstream export retained', read('packages/core/src/types/upstream/index.ts').includes("export * from './scannerCallableListInterface'")],
];
for (const [label, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
