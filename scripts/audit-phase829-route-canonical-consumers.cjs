const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
const production = walk(path.join(root,'packages')).filter(f => /\.(ts|tsx)$/.test(f) && !f.includes(`${path.sep}tests${path.sep}`) && !f.includes(`${path.sep}__tests__${path.sep}`));
const sdkTests = walk(path.join(root,'packages/sdk/tests')).filter(f => f.endsWith('.ts'));
const legacyFiles = [
'packages/core/src/compiler/scanner/descriptors/route/factories/syntheticRouteFactory.ts',
'packages/core/src/compiler/scanner/descriptors/route/factories/index.ts',
'packages/core/src/compiler/scanner/descriptors/route/factories/contractRouteFactories.ts',
'packages/core/src/compiler/scanner/descriptors/route/factories/closureRouteFactory.ts',
'packages/core/src/compiler/scanner/descriptors/route/factories/controllerActionRouteFactory.ts',
'packages/core/src/compiler/scanner/descriptors/route/factories/closureSyntheticFactories.ts',
'packages/core/src/compiler/scanner/descriptors/route/factories/controllerReferenceRouteFactory.ts',
'packages/core/src/compiler/scanner/descriptors/route/factories/actionRouteFactories.ts',
'packages/core/src/compiler/scanner/descriptors/route/routeMutations.ts',
];
const read = f => fs.readFileSync(f,'utf8');
const refs = (files, pattern) => files.filter(f => pattern.test(read(f))).map(f => path.relative(root,f));
const oldIdentity = refs(production,/route\.identity\.(?:method|groupName|runtimePath|name|path|resourceName)/);
const canonicalManifestFlat = refs(production,/route\.(?:response|groupName|actionName|crudRole|runtimePath|method|path|sourceFile)\b/).filter(f => !f.includes(`${path.sep}classifier${path.sep}`));
const factoryProduction = refs(production,/RouteSemanticFlowFactory/);
const legacyFlowProduction = refs(production,/RouteSemanticFlowLegacy/);
const flowUnionProduction = refs(production,/export\s+type\s+RouteSemanticFlow\s*=|type\s+RouteSemanticFlow\s*=/);
const cliIncrementalBridge = refs(production,/RouteSemanticFlowFactory|RouteSemanticFlowLegacy|RouteSemanticFlow\s*=/).filter(f => f.includes(`${path.sep}packages${path.sep}cli${path.sep}`));
const adapterAll = refs(walk(path.join(root,'packages')).filter(f => !f.includes(`${path.sep}upstream${path.sep}PHASE`)),/RouteBoundaryAdapter/);
const factoryTests = refs(sdkTests,/RouteSemanticFlowFactory/);
const preserved = legacyFiles.map(rel => ({file:rel,exists:fs.existsSync(path.join(root,rel)),empty:fs.existsSync(path.join(root,rel)) && fs.statSync(path.join(root,rel)).size===0}));
const report={phase:830,canonicalIdentityFlatReferences:oldIdentity,legacyFactoryProductionConsumers:factoryProduction,routeBoundaryAdapterReferences:adapterAll,canonicalManifestFlatConsumers:canonicalManifestFlat,routeSemanticFlowFactorySdkTestConsumers:factoryTests.length,routeSemanticFlowFactorySdkTests:factoryTests,preservedLegacyFiles:preserved,nextFrontier:'cut over remaining CLI flat RouteSemanticFlow consumers and then classify SDK factory-specific tests'};
console.log(JSON.stringify(report,null,2));
if(adapterAll.length || preserved.some(x=>!x.exists||!x.empty)) process.exitCode=1;
