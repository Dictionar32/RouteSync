const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['ASTNode is type-only in compiler public barrel', /export type \{ ASTNode \} from '\.\/artifacts\/ASTArtifact';/.test(read('packages/core/src/compiler/index.ts'))],
  ['ASTNode is type-only in artifacts barrel', /export type \{ ASTNode \} from '\.\/ASTArtifact';/.test(read('packages/core/src/compiler/artifacts/index.ts'))],
  ['Hash imports FileSpan as a type', /import type \{ FileSpan \} from '\.\.\/types\/FileSpan';/.test(read('packages/core/src/compiler/utils/Hash.ts'))],
  ['Hash imports Instruction as a type', /import type \{ Instruction \} from '\.\.\/ir';/.test(read('packages/core/src/compiler/utils/Hash.ts'))],
  ['SymbolDatabase is type-only in analysis barrel', /export type \{ SymbolNode, SymbolDatabase \} from '\.\/SymbolAnalysis';/.test(read('packages/core/src/compiler/analysis/index.ts'))],
  ['OptimizationPass is type-only in optimization barrel', /export type \{ OptimizationPass \} from '\.\/OptimizationPass';/.test(read('packages/core/src/compiler/optimization/index.ts'))],
  ['retired StaticLaravelScanner remains empty', fs.statSync(path.join(root, 'packages/core/src/compiler/scanner/StaticLaravelScanner.ts')).size === 0],
];
let failed = 0;
for (const [name, pass] of checks) { process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`); if (!pass) failed += 1; }
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
if (failed) process.exitCode = 1;
