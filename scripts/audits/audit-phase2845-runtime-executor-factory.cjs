const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [
  ['runtime executor factory contract exists', /interface SemanticDataflowRuntimeExecutorFactoryInterface/.test(read('packages/core/src/types/upstream/semanticDataflowInterface.ts'))],
  ['factory declares typed create operation', /readonly create:\s*\(/.test(read('packages/core/src/types/upstream/semanticDataflowInterface.ts'))],
  ['legacy exported factory function is retired', !/export const createSemanticDataflowRuntimeExecutor\s*=/.test(read('packages/core/src/types/upstream/semanticDataflowRuntimeExecutor.ts'))],
  ['runtime factory is interface-first', /export const semanticDataflowRuntimeExecutorFactory:\s*SemanticDataflowRuntimeExecutorFactoryInterface/.test(read('packages/core/src/types/upstream/semanticDataflowRuntimeExecutor.ts'))],
  ['factory composes authority and admission boundary', /semanticDataflowRuntimeExecutorFactory\.create\(semanticDataflowReasoningAuthority, semanticDataflowJudgmentBoundary\)/.test(read('packages/core/src/types/upstream/semanticDataflowRuntimeExecutor.ts'))],
  ['runtime executor preserves no-evidence ADT', /kind: 'semantic_dataflow_no_evidence'/.test(read('packages/core/src/types/upstream/semanticDataflowRuntimeExecutor.ts'))],
  ['runtime executor delegates evidence to authority then admission', /boundary\.admit\(authority\.judge\(request\.input\.value\)\)/.test(read('packages/core/src/types/upstream/semanticDataflowRuntimeExecutor.ts'))],
  ['factory interface is publicly exported from canonical barrel', /SemanticDataflowRuntimeExecutorFactoryInterface.*from '\.\/types\/upstream\/semanticDataflowInterface'/.test(read('packages/core/src/index.ts'))],
  ['collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed++; }
console.log(`${checks.length - failed}/${checks.length} checks passed`);
process.exitCode = failed ? 1 : 0;
