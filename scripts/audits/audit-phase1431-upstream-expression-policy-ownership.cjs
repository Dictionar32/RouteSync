const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/scannerExpressionCandidateAlgebra.ts');
const runtimePath = path.join(root, 'packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const indexPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const required = ['short-ternary', 'ternary', 'array-access', 'call', 'root-operator', 'unary'];
const failures = [];
for (const id of required) if (!new RegExp(`(?:'${id}'|${id.replace('-', '\\-')}):`).test(contract)) failures.push(`missing upstream policy entry: ${id}`);
for (const id of required) if (!runtime.includes(`scannerExpressionStructurePriority('${id}')`)) failures.push(`runtime does not consume upstream priority: ${id}`);
if (!index.includes('scannerExpressionStructurePriority')) failures.push('priority policy is not exported from upstream index');
if (/id: '(?:short-ternary|ternary|array-access|call|root-operator|unary)', priority: \d+/.test(runtime)) failures.push('hard-coded candidate priority remains in runtime');
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('Phase 1431 upstream expression policy ownership: 9 checks passed');
