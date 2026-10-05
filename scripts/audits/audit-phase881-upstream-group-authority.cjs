const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const flow = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/lexer/routeAst/routeDataFlow.ts'), 'utf8');
const producer = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/routeProducerRelations.ts'), 'utf8');
const context = fs.readFileSync(path.join(root, 'packages/core/src/compiler/scanner/descriptors/route/routeGroupContextResolver.ts'), 'utf8');
const checks = {
  flowUsesTypedRouteGroupFact: flow.includes("RouteGroupFact as RouteGroupValueFact") && flow.includes('export type RouteGroupData = RouteGroupValueFact'),
  flowProducesGroupMiddleware: flow.includes('middleware: Object.freeze(projectRelation([...route.middleware], createMiddlewareName))'),
  flowProducesGroupContextFacts: flow.includes('createControllerName') && flow.includes('createDomainTypeName') && flow.includes('createRouteParameterName'),
  producerConsumesDeclarationFlow: producer.includes('const declarationFlow = routeDeclarationFlow(declaration)'),
  producerResolvesGroupFromFact: producer.includes('resolveRouteGroupContextFromFact(declarationFlow.group.value)'),
  producerNoAstGroupContextCall: !producer.includes('resolveRouteGroupContext(declaration)'),
  contextExposesFactBoundary: context.includes('resolveRouteGroupContextFromFact(facts: RouteGroupFact)'),
  legacyAstAdapterRetained: fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/descriptors/route/routeGroupAstAdapter.ts')),
};
const zeroByteLegacyFiles = [];
for (const base of ['packages']) {
  const dir = path.join(root, base);
  const walk = d => { for (const entry of fs.readdirSync(d, {withFileTypes:true})) { const p=path.join(d,entry.name); if(entry.isDirectory()) walk(p); else if(fs.statSync(p).size===0) zeroByteLegacyFiles.push(path.relative(root,p)); } };
  walk(dir);
}
const result = { phase: 881, audit: 'upstream-group-authority', checks, zeroByteLegacyFileCount: zeroByteLegacyFiles.length, pass: Object.values(checks).every(Boolean) && zeroByteLegacyFiles.length >= 203 };
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.pass ? 0 : 1;
