const fs = require('fs');
const root = require('path').resolve(__dirname, '..', '..');
const ast = fs.readFileSync(`${root}/packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationAst.ts`, 'utf8');
const syntax = fs.readFileSync(`${root}/packages/core/src/compiler/scanner/lexer/routeAst/syntaxValue.ts`, 'utf8');
const relations = fs.readFileSync(`${root}/packages/core/src/compiler/scanner/lexer/routeAst/semanticRouteSyntaxRelations.ts`, 'utf8');
const flow = fs.readFileSync(`${root}/packages/core/src/compiler/scanner/lexer/routeAst/routeDataFlow.ts`, 'utf8');
const emitter = fs.readFileSync(`${root}/packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts`, 'utf8');
const scanner = fs.readFileSync(`${root}/packages/core/src/compiler/scanner/subscanners/RouteScanner.ts`, 'utf8');
const producer = fs.readFileSync(`${root}/packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts`, 'utf8');
const docs = fs.readFileSync(`${root}/packages/core/src/types/upstream/PHASE932_RESOURCE_METHOD_PARITY.md`, 'utf8');
const upstreamFlow = fs.readFileSync(`${root}/packages/core/src/types/upstream/routeResourceFlow.ts`, 'utf8');
const methods = ['resource', 'apiResource', 'singleton', 'apiSingleton'];
const labels = { resource: 'resource', apiResource: 'api_resource', singleton: 'singleton', apiSingleton: 'api_singleton' };
const hasAll = s => methods.every(m => s.includes(m));
const result = {
  astRecognizesAllResourceMethods: hasAll(ast),
  syntaxCatalogRecognizesAllResourceMethods: hasAll(syntax),
  semanticRelationRecognizesAllResourceMethods: hasAll(relations),
  routeDeclarationSemanticKindsClosed: methods.every(m => flow.includes(`${m}: '${labels[m]}'`)),
  emitterHasAllResourceMethodPlans: hasAll(emitter),
  defaultResourceActionSetPresent: ['index', 'create', 'store', 'show', 'edit', 'update', 'destroy'].every(a => upstreamFlow.includes(`action: '${a}'`)),
  scannerEmitsCanonicalResourceRoutes: scanner.includes('emitResourceRoutes') && scanner.includes('declaration.method as ResourceRouteMethod'),
  producerCarriesResourceSpecialKind: producer.includes('specialKind') && methods.every(m => producer.includes(`'${labels[m]}'`)),
  upstreamResourceMiddlewareClosurePreserved: docs.includes('RouteActionPolicyRelation') && docs.includes('SemanticDataflowFact'),
  ecomerceFixtureAbsent: !fs.existsSync(`${root}/examples/ecomerce-shop-source`),
  ecommerceFixtureAbsent: !fs.existsSync(`${root}/examples/ecommerce-shop-source`),
};
result.clean = Object.values(result).every(Boolean);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.clean ? 0 : 1;
