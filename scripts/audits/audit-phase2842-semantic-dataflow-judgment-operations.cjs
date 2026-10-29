'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/semanticDataflow.ts');
const authority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const admission = read('packages/core/src/types/upstream/semanticDataflowAdmission.ts');
const fixture = read('packages/core/src/types/upstream/__tests__/semantic-dataflow-interface-contract.phase910.test.ts');
const publicInterface = read('packages/core/src/types/upstream/semanticDataflowInterface.ts');
const barrel = read('packages/core/src/index.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['judgment explicitly carries a domain operations contract', /readonly operations: SemanticDataflowJudgmentOperationsInterface/.test(judgment)],
  ['operations contract exposes fact membership, reachability, and path queries', /readonly containsFact:[\s\S]*readonly reaches:[\s\S]*readonly pathsBetween:/.test(judgment)],
  ['fixed-point judgment omits primitive reasoning label', /interface SemanticDataflowJudgmentFixpointInterface[\s\S]*fixedPoint:[\s\S]*reasoningContract:/.test(judgment) && !/interface SemanticDataflowJudgmentFixpointInterface[\s\S]*readonly reasoning:/.test(judgment)],
  ['authority binds operations to the produced closure and paths', /operations:\s*Object\.freeze\(\{[\s\S]*containsFact:[\s\S]*factIn\(closure, fact\)[\s\S]*reaches:[\s\S]*pathsBetween:[\s\S]*paths\.filter/.test(authority)],
  ['reachability operation uses semantic identity equality', /reaches:[\s\S]*identityKey\(candidate\.source\)[\s\S]*identityKey\(source\)[\s\S]*identityKey\(candidate\.target\)[\s\S]*identityKey\(target\)/.test(authority)],
  ['path query returns endpoint-matched paths', /pathsBetween:[\s\S]*Object\.freeze\([\s\S]*paths\.filter\(path => relationEqual\(identityKey\(path\.source\), identityKey\(source\)\)[\s\S]*identityKey\(path\.target\), identityKey\(target\)/.test(authority)],
  ['admission no longer depends on a primitive reasoning tag', !/judgment\.reasoning\s*!==/.test(admission) && /contract\.strategy\s*!==\s*'declarative_relation_rewrite_fixed_point'/.test(admission)],
  ['admission rejects judgments missing domain operations', /judgment_operations_missing/.test(publicInterface) && /typeof judgment\.operations\.containsFact !== 'function'[\s\S]*typeof judgment\.operations\.reaches !== 'function'[\s\S]*typeof judgment\.operations\.pathsBetween !== 'function'/.test(admission)],
  ['structural fixture includes explicit judgment operations', /operations:\s*\{[\s\S]*containsFact:[\s\S]*reaches:[\s\S]*pathsBetween:/.test(fixture)],
  ['core barrel exports the judgment operations interface', /SemanticDataflowJudgmentOperationsInterface/.test(barrel)],
  ['collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
  ['audit script is registered', pkg.scripts?.['audit:phase2842-semantic-dataflow-judgment-operations'] === 'node scripts/audits/audit-phase2842-semantic-dataflow-judgment-operations.cjs'],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2842 semantic-dataflow judgment operations audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
console.log('SCOPE: structural source assertions only; not a TypeScript build or end-to-end scan.');
if (failed) process.exitCode = 1;
