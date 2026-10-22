const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const runtimePath = path.join(root, 'packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const interfacePath = path.join(root, 'packages/core/src/types/upstream/scannerCallableListInterface.ts');
const algebraPath = path.join(root, 'packages/core/src/types/upstream/scannerCallableListAlgebra.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__test__/scannerCallableListAlgebra.phase1471.test.ts');
const barrelPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const iface = fs.readFileSync(interfacePath, 'utf8');
const algebra = fs.readFileSync(algebraPath, 'utf8');
const barrel = fs.readFileSync(barrelPath, 'utf8');
const checks = [
  ['public typed interface exists', iface.includes('interface ScannerCallableListInterface')],
  ['closed callable-list judgments exist', iface.includes("kind: 'resolved'") && iface.includes("kind: 'malformed'") && iface.includes("kind: 'contract_violation'")],
  ['algebra delegates delimiter partitioning to shared structure authority', algebra.includes('query.structure.partitionTopLevel')],
  ['capture reference semantics live in algebra', algebra.includes('resolveCaptures') && algebra.includes('byReference')],
  ['runtime arguments use callable-list algebra', runtime.includes('scannerCallableListContractAlgebra.resolveList')],
  ['runtime captures use callable-list algebra', runtime.includes('scannerCallableListContractAlgebra.resolveCaptures')],
  ['recursive depth-based parseArguments removed', !/function parseArguments\([^)]*index\s*=\s*0/.test(runtime)],
  ['public upstream exports added', barrel.includes("export * from './scannerCallableListInterface'") && barrel.includes("export * from './scannerCallableListAlgebra'")],
  ['focused algebra tests exist', fs.existsSync(testPath)],
];
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
