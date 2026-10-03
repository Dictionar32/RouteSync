const fs = require('fs');
const path = require('path');
const roots = ['packages/core/src', 'packages/cli/src'];
const forbidden = [
  /\bif\s*\(/, /\bwhile\s*\(/, /\bfor\s*\(/, /\bswitch\s*\(/,
  /\.map\s*\(/, /\.filter\s*\(/, /\.reduce\s*\(/, /\.flatMap\s*\(/,
  /\bundefined\b/, /\bnull\b/, /\?\?/, /===|!==/, /\bas\s+[^;,)]+/
];
const excluded = [/\.test\./, /\/tests\//, /node_modules/];
const files=[];
function walk(dir){for(const name of fs.readdirSync(dir)){const p=path.join(dir,name);const s=fs.statSync(p);if(s.isDirectory())walk(p);else if(/\.ts$/.test(p)&&!excluded.some(r=>r.test(p)))files.push(p);}}
roots.forEach(walk);
let violations=0;
for(const file of files){const lines=fs.readFileSync(file,'utf8').split(/\r?\n/);for(let i=0;i<lines.length;i++){const hit=forbidden.find(r=>r.test(lines[i]));if(hit){console.log(`${file}:${i+1}: ${lines[i].trim()}`);violations++;}}}
console.log(`Phase337 semantic-authority files=${files.length} violations=${violations}`);
process.exitCode=violations?1:0;
