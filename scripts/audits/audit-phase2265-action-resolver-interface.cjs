const fs = require('node:fs');
const assert = require('node:assert/strict');

const upstream = fs.readFileSync('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts', 'utf8');
const wiring = fs.readFileSync('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts', 'utf8');

assert.match(upstream, /export interface LaravelControllerActionContractResolverInput</);
assert.match(upstream, /export interface LaravelControllerActionContractResolverInterface</);
assert.match(upstream, /readonly resolve:/);
assert.match(wiring, /readonly actionContractResolver: LaravelControllerActionContractResolverInterface</);
assert.match(wiring, /const actionContractResolver: LaravelControllerExecutionDependencies\['actionContractResolver'\]/);
assert.match(wiring, /actionContractResolver\.resolve\(Object\.freeze\(/);
assert.doesNotMatch(wiring, /const contract = resolveControllerActionContract\(/);
assert.match(wiring, /resolve: \(\{ method, controller, source, context \}\) => resolveControllerActionContract\(method, controller, source, context\)/);
assert.match(upstream, /legacy-contract-resolver-is-accessed-through-LaravelControllerActionContractResolverInterface-but-still-contains-semantic-derivation/);

console.log('Phase 2265 action-resolver interface audit: 8/8 assertions passed.');
console.log('Scope: interface contract and production wiring only; legacy semantic derivation remains explicitly open.');
