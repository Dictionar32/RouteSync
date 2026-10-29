const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const routeAst = read('packages/core/src/compiler/frontend/php/routeAst/routeDeclarationAst.ts');
const resourceAst = read('packages/core/src/compiler/frontend/php/routeAst/routeResourceDeclarationAst.ts');
const parser = read('packages/core/src/compiler/frontend/php/routeAst/routeDeclarationParser.ts');
const relations = read('packages/core/src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts');
const routeIndex = read('packages/core/src/compiler/frontend/php/routeAst/index.ts');
const scanContract = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/upstreamCompositionInterface.ts');
const authority = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const astPipeline = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const surface = read('packages/core/src/types/upstream/semanticDataflowManifestSurface.ts');
const builder = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const cliIndex = read('packages/cli/src/index.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const collectionPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const factoryPairs = [
  ['route path literal', 'RoutePathLiteralAstFactoryInterface', 'routePathLiteralAstFactory', routeAst],
  ['middleware name', 'MiddlewareNameAstFactoryInterface', 'middlewareNameAstFactory', routeAst],
  ['route prefix', 'RoutePrefixAstFactoryInterface', 'routePrefixAstFactory', routeAst],
  ['route name prefix', 'RouteNamePrefixAstFactoryInterface', 'routeNamePrefixAstFactory', routeAst],
  ['route controller', 'RouteControllerAstFactoryInterface', 'routeControllerAstFactory', routeAst],
  ['route domain', 'RouteDomainAstFactoryInterface', 'routeDomainAstFactory', routeAst],
  ['constraint parameter', 'RouteConstraintParameterAstFactoryInterface', 'routeConstraintParameterAstFactory', routeAst],
  ['constraint value', 'RouteConstraintValueAstFactoryInterface', 'routeConstraintValueAstFactory', routeAst],
  ['constraint argument ADT', 'RouteConstraintArgumentAstFactoryInterface', 'routeConstraintArgumentAstFactory', routeAst],
  ['resource middleware', 'RouteResourceMiddlewareAstOperationInterface', 'routeResourceMiddlewareAstOperation', resourceAst],
  ['resource name', 'RouteResourceNameAstFactoryInterface', 'routeResourceNameAstFactory', resourceAst],
  ['resource controller', 'RouteResourceControllerAstFactoryInterface', 'routeResourceControllerAstFactory', resourceAst],
  ['resource action', 'RouteResourceActionAstFactoryInterface', 'routeResourceActionAstFactory', resourceAst],
  ['resource route name', 'RouteResourceRouteNameAstFactoryInterface', 'routeResourceRouteNameAstFactory', resourceAst],
  ['resource parameter', 'RouteResourceParameterAstFactoryInterface', 'routeResourceParameterAstFactory', resourceAst],
];
const checks = factoryPairs.map(([label, iface, operation, source]) => [
  `${label} uses interface-first frozen operation`,
  new RegExp(`interface ${iface}\\s*\\{[\\s\\S]*?readonly`).test(source) && new RegExp(`export const ${operation}:\\s*${iface}\\s*=\\s*Object\\.freeze\\(`).test(source),
]);
checks.push(
  ['constraint argument ADT exposes domain constructors for every variant', /readonly pattern:/.test(routeAst) && /readonly values:/.test(routeAst) && /readonly none:/.test(routeAst) && /kind: 'pattern'/.test(routeAst) && /kind: 'values'/.test(routeAst) && /kind: 'none'/.test(routeAst)],
  ['parser uses typed AST factories', ['routePathLiteralAstFactory.create(', 'routePrefixAstFactory.create', 'middlewareNameAstFactory.create', 'routeConstraintParameterAstFactory.create(', 'routeConstraintValueAstFactory.create('].every((x) => parser.includes(x)) && !/\b(createRoutePathLiteral|createMiddlewareNameAst|createRoutePrefixAst|createRouteNamePrefixAst|createRouteControllerAst|createRouteDomainAst|createRouteConstraintParameterAst|createRouteConstraintValueAst)\s*\(/.test(parser)],
  ['resource middleware parser uses typed domain operation', parser.includes('routeResourceMiddlewareAstOperation.derive(') && !/\bcreateRouteResourceMiddlewareAst\s*\(/.test(parser)],
  ['public route AST barrel exports operation objects, not old constructors', routeIndex.includes('routePathLiteralAstFactory') && routeIndex.includes('middlewareNameAstFactory') && !/\b(createRoutePathLiteral|createMiddlewareNameAst|createRoutePrefixAst)\b/.test(routeIndex)],
  ['route syntax fact retains domain continuation operation', /continueForProofRelation/.test(relations) && /continuation\.routeConstraint\(value\)/.test(relations)],
  ['CLI manifest scanner contract is used as a typed scan boundary', /interface RouteSyncCliManifestScanOperationInterface/.test(scanContract) && /authority\.compose\(input\)/.test(scanContract)],
  ['CLI upstream composition and authority are explicitly contracted', /interface RouteSyncCliUpstreamCompositionInterface/.test(composition) && /interface ControllerInvocationManifestCompositionAuthorityInterface/.test(authority)],
  ['source AST and manifest contracts preserve complete/blocked judgments', /interface LaravelSourceAstPipelineInterface/.test(astPipeline) && /SemanticDataflowManifestSurfaceInterface/.test(surface) && /ManifestBuilderJudgment/.test(builder) && /blocked/.test(builder) && /complete/.test(builder)],
  ['CLI and upstream barrels export existing manifest contracts', /manifestScanOperationInterface/.test(cliIndex) && /upstreamCompositionInterface/.test(cliIndex) && /laravelSourceAstPipelineInterface/.test(upstreamIndex) && /semanticDataflowManifestSurface/.test(upstreamIndex) && /manifestBuilderInterface/.test(upstreamIndex)],
  ['upstream collections remains empty', fs.statSync(collectionPath).size === 0],
);
const failed = checks.filter(([, pass]) => !pass);
for (const [label, pass] of checks) console.log(`${pass ? 'PASS' : 'FAIL'} ${label}`);
console.log(`\n${checks.length - failed.length}/${checks.length} structural checks passed`);
if (failed.length) process.exitCode = 1;
