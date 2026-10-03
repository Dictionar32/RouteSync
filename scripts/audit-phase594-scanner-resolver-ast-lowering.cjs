const fs = require('fs');
const path = require('path');
const ROOT = path.resolve('packages/core/src');
const bannedWords = ['if','while','for','switch','undefined','null','any','new','Set','Map'];
const bannedMethods = ['map','filter','reduce','flatMap'];
const files=[];
function walk(dir){
  for(const name of fs.readdirSync(dir)){const p=path.join(dir,name); const st=fs.statSync(p); if(st.isDirectory()) walk(p); else if(/\.tsx?$/.test(name) && !p.includes(`${path.sep}__tests__${path.sep}`) && !p.endsWith('.test.ts') && !p.endsWith('.spec.ts')) files.push(p);}
}
walk(ROOT);
function codeOnly(src){
  return src.replace(/\/\*[\s\S]*?\*\//g,' ').replace(/\/\/[^\n]*/g,' ').replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g,' ');
}
const rows=files.map(file=>{const code=codeOnly(fs.readFileSync(file,'utf8')); const counts={}; for(const w of bannedWords) counts[w]=(code.match(new RegExp(`\\b${w}\\b`,'g'))||[]).length; for(const m of bannedMethods) counts[`.${m}()`]=(code.match(new RegExp(`\\.${m}\\s*\\(`,'g'))||[]).length; counts['??']=(code.match(/\?\?/g)||[]).length; counts['===']=(code.match(/===/g)||[]).length; counts['!==']=(code.match(/!==/g)||[]).length; counts['as unknown']=(code.match(/\bas\s+unknown\b/g)||[]).length; counts['ternary']=(code.match(/\?[^?:\n]+:[^=]/g)||[]).length; return {file:path.relative(process.cwd(),file),counts};});
const totals={}; for(const r of rows) for(const [k,v] of Object.entries(r.counts)) totals[k]=(totals[k]||0)+v;
const nonEmpty=rows.filter(r=>Object.values(r.counts).some(v=>v));
const empty=[...files].filter(f=>fs.statSync(f).size===0);
const out={phase:594, scope:'packages/core/src production TypeScript excluding tests', productionFiles:files.length, totals, nonEmptyResidualFiles:nonEmpty.map(r=>r.file), emptyProductionFiles:empty.map(f=>path.relative(process.cwd(),f))};
fs.writeFileSync('docs/PHASE594_SCANNER_RESOLVER_AST_LOWERING_AUDIT.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
