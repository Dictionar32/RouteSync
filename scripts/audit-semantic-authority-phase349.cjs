const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const targets = [
  'packages/core/src/semantic/kernel',
  'packages/core/src/compiler/constraints/solver',
  'packages/core/src/compiler/scanner/lexer/routeAst',
  'packages/core/src/semantic/plugins/expression',
];
const forbidden = /\b(if|while|for|switch|undefined|null)\b|\.map\(|\.filter\(|\.reduce\(|\.flatMap\(|\?\?|===|!==|\bas\b/g;
const excluded = /(^|\/)(tests?|__tests__|PHASE|.*\.test\.ts$|.*\.spec\.ts$)/;
const files=[];
function walk(dir){
  for(const name of fs.readdirSync(dir)){
    const p=path.join(dir,name), rel=path.relative(root,p);
    const s=fs.statSync(p);
    if(s.isDirectory()) walk(p);
    else if(/\.ts$/.test(name) && !excluded.test(rel)) files.push(p);
  }
}
targets.forEach(t=>walk(path.join(root,t)));
const violations=[];
for(const file of files){
  const src=fs.readFileSync(file,'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
  const hits=src.match(forbidden);
  if(hits) violations.push({file:path.relative(root,file),count:hits.length});
}
console.log(JSON.stringify({phase:349,files:files.length,violations},null,2));
process.exitCode=0;
