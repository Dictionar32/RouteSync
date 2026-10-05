const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const core = path.join(root, 'packages/core/src');
function walk(dir){ const out=[]; for(const e of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,e.name); if(e.isDirectory()) out.push(...walk(p)); else if(/\.(ts|tsx|js|cjs|mjs)$/.test(e.name)) out.push(p); } return out; }
const files=walk(core);
const refs=[];
for(const f of files){ const s=fs.readFileSync(f,'utf8'); if(/routeSemanticFactories|routeMutations/.test(s)) refs.push(path.relative(root,f)); }
const factoryFiles=walk(path.join(root,'packages/core/src/compiler/scanner/descriptors/route/factories')).filter(f=>/\.(ts|tsx)$/.test(f)).map(f=>path.relative(root,f));
const testRefs=[];
for(const f of walk(path.join(root,'packages/sdk/tests'))){ const s=fs.readFileSync(f,'utf8'); if(/descriptors\/route\/factories|RouteSemanticFlowFactory/.test(s)) testRefs.push(path.relative(root,f)); }
const result={phase:823,deletedLegacyWrappers:['packages/core/src/compiler/scanner/descriptors/route/routeSemanticFactories.ts','packages/core/src/compiler/scanner/descriptors/route/routeMutations.ts'],coreLegacyWrapperReferences:refs,remainingRouteFactoryFiles:factoryFiles,remainingFactoryTestReferences:testRefs,productionRouteFactoryTreeDetached:refs.length===0};
console.log(JSON.stringify(result,null,2));
if(refs.length!==0) process.exitCode=1;
