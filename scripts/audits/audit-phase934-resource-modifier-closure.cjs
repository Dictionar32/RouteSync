const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const ast = read('packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationAst.ts');
const parser = read('packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationParser.ts');
const emitter = read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts');
const scanner = read('packages/core/src/compiler/scanner/subscanners/RouteScanner.ts');
const flow = read('packages/core/src/types/upstream/routeResourceFlow.ts');
const route = read('packages/core/src/types/upstream/route.ts');
const forbiddenLocalTable = /RESOURCE_ROUTE_ACTIONS/;
const checks = {
  astCarriesActionFilter: ast.includes('resourceActionFilter'),
  astCarriesShallow: ast.includes('resourceShallow'),
  astCarriesScoped: ast.includes('resourceScoped'),
  astCarriesCreatable: ast.includes('resourceCreatable'),
  astCarriesDestroyable: ast.includes('resourceDestroyable'),
  parserCapturesActionFilter: parser.includes('readResourceActionFilter'),
  parserCapturesShallow: parser.includes('resourceShallow: hasResourceOperation'),
  parserCapturesScoped: parser.includes('resourceScoped: hasResourceOperation'),
  parserCapturesCreatable: parser.includes('resourceCreatable: hasResourceOperation'),
  parserCapturesDestroyable: parser.includes('resourceDestroyable: hasResourceOperation'),
  emitterBuildsRegistrationFromDeclaration: emitter.includes('resourceRegistrationFromDeclaration'),
  emitterConsumesRegistration: emitter.includes('resolveRouteResourceFlow({') && emitter.includes('registration,'),
  scannerPassesRegistration: scanner.includes('resourceRegistrationFromDeclaration(declaration, resolvedPath.resourceName)'),
  upstreamHasCanonicalResourceRegistration: route.includes("kind: 'route_resource_registration'"),
  upstreamFlowConsumesRegistration: flow.includes('actionsOf(input.registration, mode)'),
  emitterLocalActionTableAbsent: !forbiddenLocalTable.test(emitter),
  noGenericPolicyDataflowVocabulary: !(/SemanticDataflowFact|dataflow_policy|dataflow_authorization/.test(emitter + parser)),
  ecomerceFixtureAbsent: !fs.existsSync(path.join(root, 'examples/ecomerce-shop-source')),
  ecommerceFixtureAbsent: !fs.existsSync(path.join(root, 'examples/ecommerce-shop-source')),
};
checks.clean = Object.values(checks).every(Boolean);
console.log(JSON.stringify(checks, null, 2));
process.exitCode = checks.clean ? 0 : 1;
