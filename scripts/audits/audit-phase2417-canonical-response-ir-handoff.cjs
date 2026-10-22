const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const irPath = path.join(root, 'packages/core/src/types/ir/endpointIrTypes.ts');
const builderPath = path.join(root, 'packages/core/src/ir/domain/request-endpoint/endpointRefs.ts');
const ir = fs.readFileSync(irPath, 'utf8');
const builder = fs.readFileSync(builderPath, 'utf8');
const checks = [
  ['IR imports existing method-scoped Integrated Response product', ir.includes("import type { LaravelControllerMethodResponseProduct } from '../upstream/laravelControllerResponseSemanticJudgmentInterface'")],
  ['IR imports existing EndpointResponseBinding ADT', ir.includes("import type { EndpointResponseBinding } from '../upstream/endpointBindings'")],
  ['IR preserves exact method response product', ir.includes("type: 'integrated_response'; readonly product: LaravelControllerMethodResponseProduct")],
  ['IR preserves blocked judgment explicitly', ir.includes("type: 'blocked'; readonly judgment: Extract<EndpointResponseBinding, { readonly kind: 'controller_response_projection_blocked' }>")],
  ['IR preserves declared response binding', ir.includes("type: 'declared_response'; readonly binding: Extract<EndpointResponseBinding, { readonly kind: 'declared_response' }>")],
  ['IR preserves inline response binding', ir.includes("type: 'inline_response'; readonly binding: Extract<EndpointResponseBinding, { readonly kind: 'inline_response' }>")],
  ['IR preserves redirect response binding', ir.includes("type: 'redirect_response'; readonly binding: Extract<EndpointResponseBinding, { readonly kind: 'redirect_response' }>")],
  ['IR preserves file response binding', ir.includes("type: 'file_response'; readonly binding: Extract<EndpointResponseBinding, { readonly kind: 'file_response' }>")],
  ['IR preserves empty response binding', ir.includes("type: 'empty_response'; readonly binding: Extract<EndpointResponseBinding, { readonly kind: 'empty_response' }>")],
  ['IR handoff reads canonical responseProjection', builder.includes('const projection = route.binding.responseProjection')],
  ['IR handoff branches on the canonical ADT discriminant', builder.includes('switch (projection.kind)')],
  ['IR handoff has no legacy descriptor read or relation-based response classifier', !builder.includes('route.binding.response\n') && !builder.includes('resolveResponseReferenceKind')],
  ['all current EndpointResponseBinding variants are wired', ['controller_method_response', 'controller_response_projection_blocked', 'declared_response', 'inline_response', 'redirect_response', 'file_response', 'empty_response'].every(kind => builder.includes(`case '${kind}'`))],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const passed = checks.filter(([, ok]) => ok).length;
console.log(`RESULT ${passed}/${checks.length}`);
process.exitCode = passed === checks.length ? 0 : 1;
