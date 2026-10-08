const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['ControlFlowGraph is type-only at compiler entry', /export type \{ ControlFlowGraph \} from '\.\/utils\/ControlFlowGraph'/.test(read('packages/core/src/compiler/index.ts'))],
  ['DominatorTree is type-only at compiler entry', /type DominatorTree/.test(read('packages/core/src/compiler/index.ts'))],
  ['DominanceFrontier is type-only at compiler entry', /type DominanceFrontier/.test(read('packages/core/src/compiler/index.ts'))],
  ['SSARepresentation is type-only at compiler entry', /type SSARepresentation/.test(read('packages/core/src/compiler/index.ts'))],
  ['DominatorTree and DominanceFrontier are type-only in analysis barrel', /type DominatorTree/.test(read('packages/core/src/compiler/analysis/index.ts')) && /type DominanceFrontier/.test(read('packages/core/src/compiler/analysis/index.ts'))],
  ['SSARenamer runtime value preserved in analysis barrel', /\bSSARenamer,/.test(read('packages/core/src/compiler/analysis/index.ts'))],
  ['SSARenamer type contract preserved in analysis barrel', /type SSARenamer/.test(read('packages/core/src/compiler/analysis/index.ts'))],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`RESULT ${checks.length - failed}/${checks.length} passed; ${failed} failed`);
process.exitCode = failed ? 1 : 0;
