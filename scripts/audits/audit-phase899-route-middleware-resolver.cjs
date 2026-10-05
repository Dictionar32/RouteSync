const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const resolver = path.join(root, 'packages/core/src/compiler/scanner/upstream/route/routeMiddlewareFlowResolver.ts');
const types = path.join(root, 'packages/core/src/types/upstream/routeMiddleware.ts');
const test = path.join(root, 'packages/core/src/types/upstream/__tests__/route-middleware-flow-resolver.phase899.test.ts');
const doc = path.join(root, 'packages/core/src/types/upstream/PHASE899_ROUTE_MIDDLEWARE_RESOLVER_RESTORATION.md');

const read = file => fs.readFileSync(file, 'utf8');
const r = read(resolver);
const t = read(types);
const x = read(test);
const d = read(doc);

const checks = {
  semanticInputClosed: /interface RouteMiddlewareSemanticInput\s*\{[\s\S]*declarations:[\s\S]*exclusions:[\s\S]*action: Presence<ActionName>/.test(t),
  resolverExists: /export const resolveRouteMiddlewareFlow/.test(r),
  resolverIsAstFree: !/RouteDeclarationAst|ControllerMethodAst|RouteAst/.test(r),
  scopeAllOnlyExcept: /scopeApplies/.test(r) && /'all'/.test(t) && /'only'/.test(t) && /'except'/.test(t),
  absentActionDoesNotApplyScoped: /relationEqual\(action\.kind, 'present'\)/.test(r),
  exclusionApplied: /exclusionApplies/.test(r) && /!exclusionApplies\(/.test(r),
  identityMatch: /middleware\.name\.value\.value/.test(r),
  noHostIncludes: !r.includes('.includes('),
  noNullish: !r.includes('??'),
  regressionOnlyExcept: /only/.test(x) && /except/.test(x),
  regressionExclusion: /exclusions/.test(x) && /subscribed/.test(x),
  regressionAbsentAction: /kind: 'absent'/.test(x),
  docsBoundary: /ADT -> ADT/.test(d) && /HasMiddleware/.test(d) && /separate evidence frontier/.test(d),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const result = { phase: 899, checks, allPassed: failed.length === 0, failed };
console.log(JSON.stringify(result, null, 2));
if (failed.length) process.exitCode = 1;
