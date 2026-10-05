const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const core = path.join(root, 'packages', 'core', 'src');
function walk(dir){const out=[]; for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name); if(e.name==='node_modules') continue; if(e.isDirectory()) out.push(...walk(p)); else if(/\.(ts|tsx|mts|cts)$/.test(e.name)) out.push(p);} return out;}
const files=walk(core);
const text=f=>fs.readFileSync(f,'utf8');
const matches=(needle)=>files.filter(f=>text(f).includes(needle));
const routeFactoryConsumers=matches('RouteSemanticFlowFactory');
const routeFactoryNonDefinition=routeFactoryConsumers.filter(f=>!f.endsWith('RouteSemanticFlowFactory.ts'));
const bridge=path.join(core,'compiler','scanner','subscanners','routeProducerRelations.ts');
const invalidation=path.join(core,'compiler','scanner','subscanners','InvalidationResolver.ts');
const typeDeriver=path.join(core,'compiler','scanner','subscanners','typeDeriverUtils.ts');
const result={
 phase:820,
 routeProducerRelationsUsesLegacyFactory:text(bridge).includes('RouteSemanticFlowFactory'),
 routeProducerRelationsUsesLegacyFlow:text(bridge).includes('RouteSemanticFlow'),
 invalidationUsesLegacyFactory:text(invalidation).includes('RouteSemanticFlowFactory'),
 typeDeriverUsesLegacyFactory:text(typeDeriver).includes('RouteSemanticFlowFactory'),
 parameterPathUsesDescriptorFactory:[path.join(core,'compiler','scanner','subscanners','route-scanner','routePathParser.ts'),path.join(core,'compiler','scanner','resolvers','boundary','boundaryBasics.ts')].some(f=>text(f).includes('descriptors/routeDescriptors')),
 routeFactoryConsumerFileCount:routeFactoryNonDefinition.length,
 routeFactoryConsumerFiles:routeFactoryNonDefinition.map(f=>path.relative(root,f)).sort(),
 routeSemanticFlowFileCount:matches('RouteSemanticFlow').length,
};
console.log(JSON.stringify(result,null,2));
