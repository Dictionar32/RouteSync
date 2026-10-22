const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const boundaryTypes = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasicsTypes.ts');
const bindingBuilder = read('packages/core/src/compiler/scanner/resolvers/boundary/bindingBuilder.ts');
const boundaryInput = read('packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts');
const routeRelations = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const routeBinding = read('packages/core/src/types/domain/routes.ts');
const routeContract = read('packages/core/src/types/upstream/route.ts');
const responseProjectionFunction = scanner.split('const responseProjectionForTarget = (')[1]?.split('const sequenceToArray')[0] ?? '';
const checks = [
  ['response projection is required by authoring boundary contract', boundaryTypes.includes('readonly responseProjection: EndpointResponseBinding;')],
  ['resolved boundary preserves the same response projection', boundaryTypes.split('export interface ResolvedRouteBoundaryOptions')[1]?.includes('readonly responseProjection: EndpointResponseBinding;') === true && boundaryInput.includes('responseProjection: params.responseProjection')],
  ['boundary binding builder forwards the exact projection', bindingBuilder.includes('responseProjection: params.responseProjection')],
  ['canonical RouteBindingContract owns response projection', routeBinding.includes('readonly responseProjection: import(\'../upstream/endpointBindings\').EndpointResponseBinding;')],
  ['boundary composition accepts the projection beside the exact emitted route target', routeRelations.includes('responseProjection: EndpointResponseBinding,') && scanner.includes('responseProjectionForTarget(target, controllerScan, actionSelection)')],
  ['response projection reuses the exact existing action-correlation judgment', scanner.includes('responseProjectionForTarget(target, controllerScan, actionSelection)') && !responseProjectionFunction.includes('correlationAuthority.judge({')],
  ['resource route targets are correlated after resource action expansion', scanner.includes('responseProjectionForTarget(target, controllerScan, actionSelection)')],
  ['route producer consumes the projection from the boundary binding', routeRelations.includes('const response: EndpointResponseBinding = route.binding.responseProjection')],
  ['producer operation no longer accepts a second potentially conflicting projection', !routeContract.includes('readonly responseProjection: EndpointResponseBinding;') && !routeContract.includes('readonly responseProjection: import(\'./endpointBindings\').EndpointResponseBinding;')],
  ['declaration-level response selection was retired', !scanner.includes('responseProjectionForDeclaration') && !scanner.includes('const responseProjection = responseProjectionForDeclaration')],
  ['exact source-span check remains in method product correlation', scanner.includes('sameMethodSource(product.method.source, publication.source)')],
  ['legacy descriptor is not used to derive canonical route AST response', !routeRelations.includes('route.binding.response.responseTypeName()')],
];
let failed = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failed += 1;
}
process.stdout.write(`Phase2414 route response boundary assertions: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed === 0 ? 0 : 1;
