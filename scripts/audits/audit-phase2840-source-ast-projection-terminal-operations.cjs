'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const producer = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const barrel = read('packages/core/src/index.ts');
const pkg = JSON.parse(read('package.json'));
const variants = [
  'complete', 'blocked', 'attribute_scan_blocked', 'dto_declaration_inventory_blocked',
  'controller_scan_blocked', 'route_scan_blocked', 'route_response_blocked',
  'route_policy_blocked', 'resource_scan_blocked',
];
const checks = [
  ['projection outcomes are represented by a closed data union', /LaravelSourceAstProjectionJudgmentData[\s\S]*laravel_source_ast_projection_complete[\s\S]*laravel_source_ast_projection_blocked/.test(contract)],
  ['the ADT exposes a typed continuation operation', /continueWith: <Result>\(handlers: LaravelSourceAstProjectionJudgmentHandlers<Receipt, Result>\)/.test(contract)],
  ['continuation separates complete projection from every blocked projection', /onComplete: \(judgment: LaravelSourceAstProjectionCompleteJudgment<Receipt>\) => Result[\s\S]*onBlocked: \(judgment: LaravelSourceAstProjectionBlockedJudgment<Receipt>\) => Result/.test(contract)],
  ['producer constructors are exposed as an interface-first frozen operation object', /export const laravelSourceAstProjectionOperations:\s*LaravelSourceAstProjectionOperationsInterface\s*=\s*Object\.freeze\(/.test(contract)],
  ['complete terminal binds its own continuation at construction', /complete:[\s\S]*continueWith:[\s\S]*handlers\.onComplete\(judgment\)/.test(contract)],
  ['blocked terminal binds its own continuation at construction', /blocked:[\s\S]*continueWith:[\s\S]*handlers\.onBlocked\(judgment\)/.test(contract)],
  ...variants.map(variant => [`${variant} producer routes through terminal operations`, variant === 'complete' ? /laravelSourceAstProjectionOperations\.complete\(Object\.freeze\(\{ kind: 'laravel_source_ast_projection_complete'/.test(producer) : variant === 'blocked' ? /laravelSourceAstProjectionOperations\.blocked\(Object\.freeze\(\{ kind: 'laravel_source_ast_projection_blocked'/.test(producer) : producer.includes(`laravelSourceAstProjectionOperations.blocked(Object.freeze({\n            kind: 'laravel_source_ast_projection_${variant}'`)]),
  ['manifest builder follows projection.continueWith instead of inspecting its kind', /projection\.continueWith\(\{[\s\S]*onBlocked: blockedProjection =>[\s\S]*onComplete: async completeProjection =>/.test(builder) && !/projection\.kind\s*!==?/.test(builder)],
  ['blocked source-AST projection is preserved without normalization', /projection:\s*blockedProjection/.test(builder) && /stage: 'source_ast'/.test(builder)],
  ['core barrel exports the terminal operation and handler contract', /laravelSourceAstProjectionOperations/.test(barrel) && /LaravelSourceAstProjectionJudgmentHandlers/.test(barrel)],
  ['upstream collections remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
  ['audit script is registered', pkg.scripts?.['audit:phase2840-source-ast-projection-terminal-operations'] === 'node scripts/audits/audit-phase2840-source-ast-projection-terminal-operations.cjs'],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2840 source-AST projection terminal operations audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
console.log('SCOPE: structural source assertions only; not a TypeScript build or end-to-end scan.');
if (failed) process.exitCode = 1;
