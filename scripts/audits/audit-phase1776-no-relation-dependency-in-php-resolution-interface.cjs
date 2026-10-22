const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const target = path.join(root, 'packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const source = fs.readFileSync(target, 'utf8');
const checks = [
  ['does not import semantic relation sequence', !source.includes("semantic/relations/relationalSequence")],
  ['function import collection remains domain typed', source.includes('readonly items: readonly PhpFunctionImportBinding[];')],
  ['declared function collection remains domain typed', source.includes('readonly items: readonly PhpDeclaredFunctionSymbol[];')],
  ['resolution contract remains present', source.includes('interface PhpFunctionNameResolutionContract')],
  ['resolution rules remain closed', source.includes('export type PhpFunctionNameResolutionRule =')],
  ['deferred PHP fallback retains namespace candidate', source.includes('readonly namespaceCandidate: PhpQualifiedFunctionName;')],
  ['deferred PHP fallback retains global candidate', source.includes('readonly globalFallbackCandidate: PhpQualifiedFunctionName;')],
];
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
if (checks.some(([, pass]) => !pass)) process.exitCode = 1;
