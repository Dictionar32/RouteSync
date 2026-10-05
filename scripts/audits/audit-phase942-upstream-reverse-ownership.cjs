const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const core = path.join(root, 'packages/core/src');
const typesUpstream = path.join(core, 'types/upstream');
const scannerUpstream = path.join(core, 'compiler/scanner/upstream');
const walk = dir => { const out=[]; if(!fs.existsSync(dir)) return out; for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name); if(e.isDirectory()) out.push(...walk(p)); else if(/\.(ts|tsx|js|cjs|mjs)$/.test(e.name)) out.push(p);} return out; };
const read=f=>fs.readFileSync(f,'utf8');
const allTypes=walk(typesUpstream), prodTypes=allTypes.filter(f=>!f.includes(`${path.sep}__tests__${path.sep}`));
const reverseAny=allTypes.filter(f=>/compiler\/scanner\//.test(read(f)));
const reverseProd=prodTypes.filter(f=>/compiler\/scanner\//.test(read(f)));
const scannerProd=walk(scannerUpstream).filter(f=>!f.includes(`${path.sep}__tests__${path.sep}`));
const scannerToTypes=scannerProd.filter(f=>/types\/upstream/.test(read(f)));
const result={
  canonicalUpstreamExists:fs.existsSync(typesUpstream),
  literalCoreSrcUpstreamAbsent:!fs.existsSync(path.join(core,'upstream')),
};
result.noScannerImportsFromUpstream=reverseAny.length===0;
result.noScannerImportsFromUpstreamProduction=reverseProd.length===0;
result.scannerUpstreamDependsOnCanonicalTypes=scannerToTypes.length>0;
result.ecommerceFixtureExists=fs.existsSync(path.join(root,'packages/sdk/tests/fixtures/ecommerce-shop-source'));
result.oldExamplePathsAbsent=!fs.existsSync(path.join(root,'examples/ecomerce-shop-source'))&&!fs.existsSync(path.join(root,'examples/ecommerce-shop-source'));
result.clean=Object.values(result).every(Boolean);
console.log(JSON.stringify({...result,reverseAny:reverseAny.map(f=>path.relative(root,f)),reverseProduction:reverseProd.map(f=>path.relative(root,f)),scannerToTypesFiles:scannerToTypes.map(f=>path.relative(root,f))},null,2));
if(!result.clean) process.exit(1);
