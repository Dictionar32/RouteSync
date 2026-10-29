const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const sourcePath = 'packages/core/src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts';
const parserPath = 'packages/core/src/compiler/frontend/php/routeAst/routeDeclarationParser.ts';
const astContractPath = 'packages/core/src/compiler/frontend/php/routeAst/routeDeclarationAst.ts';
const upstreamPath = 'packages/core/src/types/upstream/routeDeclarationEvidence.ts';
const scannerContractPath = 'packages/core/src/types/upstream/laravelRouteScannerInterface.ts';
const tracePath = 'packages/core/src/types/upstream/PHASE2818_ROUTE_PATH_POLICY_DIRECT_ADT_AUDIT.md';
const source = fs.readFileSync(path.join(root, sourcePath), 'utf8');
const parser = fs.readFileSync(path.join(root, parserPath), 'utf8');
const astContract = fs.readFileSync(path.join(root, astContractPath), 'utf8');
const upstream = fs.readFileSync(path.join(root, upstreamPath), 'utf8');
const scannerContract = fs.readFileSync(path.join(root, scannerContractPath), 'utf8');
const trace = fs.readFileSync(path.join(root, tracePath), 'utf8');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const start = source.indexOf('const routePathTokenExpectation =');
const end = source.indexOf('export interface RouteResourceMiddlewareSyntaxModel', start);
const pathDomain = source.slice(start, end);
const checks = [
  ['route path expectation is a direct closed-domain switch', /const routePathTokenExpectation = \(method: LaravelRouteMethod\): RoutePathTokenExpectation => \{\s*switch \(method\)/.test(pathDomain)],
  ['route path policy catalog removed', !/ROUTE_PATH_TOKEN_POLICIES|RoutePathTokenPolicy/.test(source)],
  ['route path fact creation does not call generic catalog helpers', /const createRoutePathTokenFact = \(cursor: TokenCursor, method: LaravelRouteMethod\): RoutePathTokenFact => \{\s*const expectation = routePathTokenExpectation\(method\);/.test(pathDomain) && !/catalogRequired|catalogLookup|relationOptionFold|relationContains|relationFirst|relationResolve|relationVariantFold/.test(pathDomain)],
  ['fact owns a domain-specific acceptance continuation', /continueForAcceptance: <Output>\(continuation: RoutePathTokenAcceptanceContinuation<Output>\) => Output/.test(source) && /continuation\[expectation\]\(actual\)/.test(pathDomain)],
  ['factory export is interface-first and frozen', /export const routePathTokenFactFactory: RoutePathTokenFactFactoryInterface = Object\.freeze\(/.test(source)],
  ['acceptance export is interface-first and frozen', /export const routePathTokenAcceptanceOperation: RoutePathTokenAcceptanceOperationInterface = Object\.freeze\(/.test(source)],
  ['acceptance continuation directly discriminates the ADT', /string: actual => actual\.kind === 'string'/.test(pathDomain)],
  ['parser invokes typed acceptance operation', /routePathTokenAcceptanceOperation\.accepts\(at, method\)/.test(parser)],
  ['existing upstream route method ADT is reused', /LaravelRouteMethodEvidence[\s\S]*'get'[\s\S]*'apiSingleton'/.test(upstream) && /LaravelRouteMethod/.test(scannerContract) && /laravelRouteScannerInterface/.test(astContract)],
  ['runtime trace records CLI-to-manifest boundary and remaining scope', /RouteSyncCliManifestScanOperationInterface\.scan/.test(trace) && /LaravelSourceAstPipelineInterface\.execute/.test(trace) && /does not claim global removal/.test(trace)],
  ['upstream collections remains exactly 0 bytes', collections.length === 0],
  ['no generic reasoning primitive introduced', !/GenericReasoningPrimitive|UniversalReasoningVisitor|ReasoningDispatcher/.test(source + parser)],
];
let failures = 0;
for (const [label, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
  if (!passed) failures += 1;
}
console.log(`${checks.length - failures}/${checks.length} checks passed`);
if (failures) process.exitCode = 1;
