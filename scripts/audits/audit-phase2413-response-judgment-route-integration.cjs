const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const route = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const routeRelations = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const endpoint = read('packages/core/src/types/upstream/endpointBindings.ts');
const routeContract = read('packages/core/src/types/upstream/route.ts');
const relationModel = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const checks = [
  ['route-facing response ADT retains exact method response product', endpoint.includes("kind: 'controller_method_response'; readonly product: LaravelControllerMethodResponseProduct")],
  ['route-facing response ADT has explicit blocked projection outcome', endpoint.includes("kind: 'controller_response_projection_blocked'")],
  ['method response correlation checks controller/action identity', route.includes('product.method.action.controller.value.value === publication.controller.value.value') && route.includes('product.method.action.action.value.value === publication.action.value.value')],
  ['method response correlation checks exact source span', route.includes('sameMethodSource(product.method.source, publication.source)')],
  ['unmatched, ambiguous, and non-projectable products remain distinct blockers', route.includes("reason: 'method_response_product_unmatched'") && route.includes("reason: 'method_response_product_ambiguous'") && route.includes("reason: 'method_response_product_not_projectable'") && route.includes("reason: 'response_judgment_unavailable'")],
  ['unmatched, ambiguous, invalid, and closure route targets remain explicit blockers', route.includes("reason: 'action_judgment_unmatched'") && route.includes("reason: 'action_judgment_ambiguous'") && route.includes("reason: 'action_judgment_provenance_invalid'") && route.includes("reason: 'closure_response_not_correlated'")],
  ['route scanner passes response projection into existing operation contract', route.includes('responseProjectionForDeclaration(evidence, controllerScan, actionJudgments, correlationAuthority)') && route.includes('methodJudgment, responseProjection')],
  ['operation contract requires response projection as a typed input', routeContract.includes('readonly responseProjection: EndpointResponseBinding')],
  ['route producer consumes the supplied response ADT without descriptor reclassification', routeRelations.includes('const response: EndpointResponseBinding = responseProjection') && !routeRelations.includes('route.binding.response.responseTypeName()')],
  ['semantic relation model accounts for both new response ADT variants', relationModel.includes('controller_method_response: () => []') && relationModel.includes('controller_response_projection_blocked: () => []')],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase2413 response integration assertions: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
