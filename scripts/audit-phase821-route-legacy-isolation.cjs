const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
function walk(dir) { const out=[]; for (const e of fs.readdirSync(dir,{withFileTypes:true})) { const p=path.join(dir,e.name); if(e.isDirectory()) out.push(...walk(p)); else if(/\.(ts|tsx|js|cjs|mjs)$/.test(e.name)) out.push(p); } return out; }
function refs(dir, needle) { return walk(dir).filter(f=>fs.readFileSync(f,'utf8').includes(needle)).map(f=>path.relative(root,f).replaceAll('\\','/')); }
const core=path.join(root,'packages/core/src');
const factoryRefs=refs(path.join(root,'packages'),'RouteSemanticFlowFactory');
const productionFactoryConsumers=factoryRefs.filter(f=>f.startsWith('packages/core/src/')&&!f.endsWith('RouteSemanticFlowFactory.ts')&&!f.includes('/descriptors/route/'));
const cliOwnFactoryImplementations=factoryRefs.filter(f=>f.startsWith('packages/cli/src/'));
const factorySource=fs.readFileSync(path.join(core,'compiler/scanner/descriptors/route/RouteSemanticFlowFactory.ts'),'utf8');
const publicExports=['packages/core/src/index.ts','packages/core/src/compiler/index.ts','packages/core/src/compiler/scanner/scannerExports.ts','packages/core/src/compiler/scanner/descriptors/index.ts','packages/core/src/compiler/scanner/descriptors/routeDescriptors.ts'];
console.log(JSON.stringify({
 phase:821,
 deletedDescriptorHelper:!fs.existsSync(path.join(core,'compiler/scanner/descriptors/route/routeMethods.ts')),
 deletedDescriptorHelperReferences:refs(core,'resolveRouteDescriptorDomain').concat(refs(core,'resolveRouteDescriptorSecurity')),
 factoryReferenceFileCount:factoryRefs.length,
 cliOwnFactoryImplementations,
 productionFactoryConsumers,
 factoryStillPublic:publicExports.filter(f=>fs.existsSync(path.join(root,f))&&fs.readFileSync(path.join(root,f),'utf8').includes('RouteSemanticFlowFactory')),
 factoryMethodSurfaceReduced:!factorySource.includes('resolveDomain')&&!factorySource.includes('resolveSecurityAndPolicies'),
 nextFrontier:productionFactoryConsumers.length===0?'migrate SDK fixtures/tests then remove public legacy factory exports':'eliminate remaining production consumers before export removal'
},null,2));
