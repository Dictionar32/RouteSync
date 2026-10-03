const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const src=path.join(root,'packages/core/src');
const files=[];
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{const p=path.join(d,e.name); if(e.isDirectory()) walk(p); else if(/\.tsx?$/.test(e.name)) files.push(p);});
walk(src);
const set=new Set(files);
const resolve=(from,spec)=>{if(!spec.startsWith('.'))return null; const b=path.resolve(path.dirname(from),spec); for(const x of [b,b+'.ts',b+'.tsx',path.join(b,'index.ts'),path.join(b,'index.tsx')]) if(set.has(x)) return x; return null;};
const inbound=new Map(files.map(f=>[f,[]]));
for(const f of files){const s=fs.readFileSync(f,'utf8'); for(const m of s.matchAll(/(?:from\s+|import\s*\(|export\s+[^;]*?from\s+)["']([^"']+)["']/g)){const r=resolve(f,m[1]); if(r) inbound.get(r).push(f);}}
const entries=new Set([
 path.join(src,'index.ts'),path.join(src,'compiler/index.ts'),path.join(src,'scanner/scannerExports.ts'),path.join(src,'scanner/LaravelSourceLexer.ts')
]);
const candidates=files.filter(f=>inbound.get(f).length===0&&!entries.has(f)&&!f.includes('__tests__')&&!f.includes('__test__')).map(f=>path.relative(root,f));
console.log(JSON.stringify({candidateCount:candidates.length,candidates:candidates.slice(0,200)},null,2));
