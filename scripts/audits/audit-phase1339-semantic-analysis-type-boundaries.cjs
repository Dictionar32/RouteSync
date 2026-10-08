const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['PrimitiveType is imported type-only by Eloquent domain', /import type \{ PrimitiveType \} from ["']\.\/semanticType["']/.test(read('packages/core/src/types/domain/eloquentTypes.ts'))],
  ['ASTNode has a standalone type export from compiler barrel', /export type \{ ASTNode \} from '\.\/artifacts\/ASTArtifact';/.test(read('packages/core/src/compiler/index.ts'))],
  ['ASTNode remains type-only in artifacts barrel', /export type \{ ASTNode \} from '\.\/ASTArtifact';/.test(read('packages/core/src/compiler/artifacts/index.ts'))],
  ['InstructionEffect is exported type-only', /type InstructionEffect,/.test(read('packages/core/src/compiler/optimization/index.ts'))],
  ['SymbolDatabase and SymbolNode have standalone type exports', /export type \{ SymbolNode, SymbolDatabase \} from '\.\/SymbolAnalysis';/.test(read('packages/core/src/compiler/analysis/index.ts'))],
  ['VerificationContext has standalone type export', /export type \{ VerificationContext \} from '\.\/VerificationContext';/.test(read('packages/core/src/compiler/verification/index.ts'))],
  ['EffectAnalysis has standalone type export', /export type \{ EffectAnalysis \} from '\.\/EffectAnalysis';/.test(read('packages/core/src/compiler/verification/index.ts'))],
  ['SymbolGraphArtifact imports canonical SemanticType directly as type', read('packages/core/src/compiler/artifacts/SymbolGraphArtifact.ts').includes("import type { SemanticType } from '../../types/domain/semanticType';")],
  ['retired StaticLaravelScanner remains empty', fs.statSync(path.join(root, 'packages/core/src/compiler/scanner/StaticLaravelScanner.ts')).size === 0],
];
let failed = 0;
for (const [name, pass] of checks) { process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`); if (!pass) failed += 1; }
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
if (failed) process.exitCode = 1;
