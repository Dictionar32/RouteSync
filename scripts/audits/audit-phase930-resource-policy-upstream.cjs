const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const parser = read('packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationParser.ts');
const ast = read('packages/core/src/compiler/scanner/lexer/routeAst/routeDeclarationAst.ts');
const evidence = read('packages/core/src/types/upstream/routeDeclarationEvidence.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts');
const route = read('packages/core/src/types/upstream/route.ts');
const audit = {
  parserCapturesResourceMiddleware: parser.includes('readResourceMiddleware') && parser.includes('resourceMiddlewareExclusions'),
  parserUsesCanonicalResourceSyntax: parser.includes('resourceMiddlewareSyntax') && parser.includes('createRouteResourceMiddlewareAst'),
  astCarriesResourceMiddlewareEvidence: ast.includes('resourceMiddleware:') && ast.includes('resourceMiddlewareExclusions:'),
  evidenceCarriesResourceMiddleware: evidence.includes('resourceMiddleware:') && evidence.includes('resourceMiddlewareExclusions:'),
  producerMapsResourceRules: producer.includes('routeResourceMiddlewareRules(declaration)'),
  upstreamResourceRuleExists: route.includes('RouteResourceMiddlewareRule'),
  producerNoLongerDropsResourceMiddleware: !producer.includes("middleware: { kind: 'empty' },"),
  noPolicyDataflowVocabulary: ![parser, producer].some(s => /dataflow_(middleware|authorization|policy)/.test(s)),
  ecomerceFixtureAbsent: !fs.existsSync(path.join(root, 'examples/ecomerce-shop-source')),
  ecommerceFixtureAbsent: !fs.existsSync(path.join(root, 'examples/ecommerce-shop-source')),
};
audit.clean = Object.values(audit).every(Boolean);
console.log(JSON.stringify(audit, null, 2));
process.exitCode = audit.clean ? 0 : 1;
