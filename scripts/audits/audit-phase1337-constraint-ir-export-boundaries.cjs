const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['TypeEnvironment is exported type-only from constraints barrel', /export \{ type TypeEnvironment, type VariableState, createTypeEnvironment \} from '\.\/TypeEnvironment';/.test(read('packages/core/src/compiler/constraints/index.ts'))],
  ['UnionFind contract is type-only and factories remain runtime exports', /export \{ type UnionFind, createUnionFind, unionFindFind, unionFindUnion \} from '\.\/UnionFind';/.test(read('packages/core/src/compiler/constraints/index.ts'))],
  ['compiler barrel exports constraint contracts type-only', /type TypeEnvironment,/.test(read('packages/core/src/compiler/index.ts')) && /type UnionFind as ConstraintUnionFind,/.test(read('packages/core/src/compiler/index.ts'))],
  ['constraint runtime operations remain exported', /createTypeEnvironment,/.test(read('packages/core/src/compiler/index.ts')) && /createUnionFind,/.test(read('packages/core/src/compiler/index.ts')) && /solveConstraints,/.test(read('packages/core/src/compiler/index.ts'))],
  ['IR constants are sourced from their runtime-defining module', /export \{ ArrayConstant, ClassConstant, EnumCase \} from '\.\.\/utils\/cfg\/constants';/.test(read('packages/core/src/compiler/ir/index.ts'))],
  ['Expression compatibility module remains type-only', /export type \{[\s\S]*ArrayConstant,[\s\S]*ClassConstant,[\s\S]*EnumCase,[\s\S]*\} from '\.\.\/utils\/cfg\/constants';/.test(read('packages/core/src/compiler/ir/Expression.ts'))],
  ['retired StaticLaravelScanner remains empty', fs.statSync(path.join(root, 'packages/core/src/compiler/scanner/StaticLaravelScanner.ts')).size === 0],
];
let failed = 0;
for (const [name, pass] of checks) { process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`); if (!pass) failed += 1; }
process.stdout.write(`${checks.length - failed}/${checks.length} checks passed\n`);
if (failed) process.exitCode = 1;
