const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const root = path.resolve('packages/core/src');
const bannedKinds = new Map([
  [ts.SyntaxKind.IfStatement, 'if'],
  [ts.SyntaxKind.ForStatement, 'for'],
  [ts.SyntaxKind.ForInStatement, 'for-in'],
  [ts.SyntaxKind.ForOfStatement, 'for-of'],
  [ts.SyntaxKind.WhileStatement, 'while'],
  [ts.SyntaxKind.DoStatement, 'do-while'],
  [ts.SyntaxKind.SwitchStatement, 'switch'],
  [ts.SyntaxKind.ConditionalExpression, 'ternary'],
]);
const bannedCalls = new Set(['map','filter','reduce','flatMap']);
const files=[];
function collect(dir){ for(const e of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,e.name); if(e.isDirectory()) collect(p); else if(/\.tsx?$/.test(e.name)) files.push(p); }}
collect(root);
const hits=[];
for(const file of files){
 const text=fs.readFileSync(file,'utf8');
 const sf=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const kinds=[]; const calls=[];
 function visit(n){
   const k=bannedKinds.get(n.kind); if(k){ const lc=sf.getLineAndCharacterOfPosition(n.getStart(sf)); kinds.push({kind:k,line:lc.line+1,col:lc.character+1}); }
   if(ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)){
      const name=n.expression.name.text; if(bannedCalls.has(name)){ const lc=sf.getLineAndCharacterOfPosition(n.getStart(sf)); calls.push({kind:'.'+name+'()',line:lc.line+1,col:lc.character+1}); }
   }
   ts.forEachChild(n,visit);
 }
 visit(sf);
 if(kinds.length||calls.length) hits.push({file:path.relative(process.cwd(),file), kinds, calls});
}
const summary={filesScanned:files.length,filesWithHits:hits.length,totalKinds:hits.reduce((a,h)=>a+h.kinds.length,0),totalCalls:hits.reduce((a,h)=>a+h.calls.length,0),byTop:{}};
for(const h of hits){ const top=h.file.split(path.sep)[3]||h.file.split(path.sep)[2]||'?'; const key=top; summary.byTop[key]??={files:0,kinds:0,calls:0}; summary.byTop[key].files++; summary.byTop[key].kinds+=h.kinds.length; summary.byTop[key].calls+=h.calls.length; }
console.log(JSON.stringify({summary,hits},null,2));
