const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const controller = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const route = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const routeRelations = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const boundaryOptions = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasicsTypes.ts');
const routeBindings = read('packages/core/src/types/domain/routes.ts');
const endpointBindings = read('packages/core/src/types/upstream/endpointBindings.ts');
const routeContract = read('packages/core/src/types/upstream/route.ts');
const ast = read('packages/core/src/types/upstream/ast.ts');
const report = read('packages/core/src/types/upstream/docs/PHASE2412_ROUTE_RESPONSE_ADT_OWNERSHIP_AND_PROJECTION_GAP.md');
const checks = [
  ['controller scan executes existing integrated response judgment', controller.includes('this.responseSemanticPipeline.judgeIntegratedResponse(')],
  ['controller artifact retains response judgment', controller.includes('responseJudgment,')],
  ['route scanner now projects response judgment through the route producer operation', route.includes('responseProjectionForDeclaration(evidence, controllerScan, actionJudgments, correlationAuthority)') && route.includes('methodJudgment, responseProjection')],
  ['active route emitter still seeds compatibility void descriptor', route.includes('const unresolvedResponse = VoidResponseDescriptor.create()')],
  ['route boundary options require legacy ResponseDescriptor', boundaryOptions.includes('readonly response: ResponseDescriptor')],
  ['route binding contract remains owned by ResponseDescriptor', routeBindings.includes('readonly response: ResponseDescriptor')],
  ['route boundary copies target response descriptor', routeRelations.includes('response: value.response')],
  ['route producer no longer synthesizes response reference from compatibility descriptor', !routeRelations.includes('route.binding.response.responseTypeName()') && routeRelations.includes('const response: EndpointResponseBinding = responseProjection')],
  ['endpoint response ADT preserves canonical method result and blocked projection', endpointBindings.includes("readonly kind: 'controller_method_response'") && endpointBindings.includes("readonly kind: 'controller_response_projection_blocked'")],
  ['route AST retains EndpointResponseBinding rather than ResponseResult product', routeContract.includes('readonly response: EndpointResponseBinding') && routeContract.includes('readonly bindings: RouteBindings')],
  ['report identifies existing ADT owners and rejects unused sidecar', report.includes('not permission to create a parallel response model') && report.includes('EndpointResponseBinding')],
  ['report explicitly avoids claiming functional closure', report.includes('does not claim closure')],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase2412 structural assertions: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
