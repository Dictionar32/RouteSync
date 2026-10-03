const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const roots = [path.join(root, 'packages/core/src/semantic'), path.join(root, 'packages/core/src/compiler/scanner'), path.join(root, 'packages/core/src/compiler/analysis/dataflow')];
const excluded = new Set(['__test__', '__tests__', 'test', 'tests']);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (excluded.has(entry.name)) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.isFile() && p.endsWith('.ts')) files.push(p);
  }
}
roots.forEach(walk);
const forbidden = {if:0,for:0,while:0,switch:0,map:0,filter:0,reduce:0,flatMap:0,undefined:0,null:0,strictEq:0,strictNe:0,as:0,unknown:0};
const violations=[];
for (const file of files) {
  const source=fs.readFileSync(file,'utf8');
  const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  const c={if:0,for:0,while:0,switch:0,map:0,filter:0,reduce:0,flatMap:0,undefined:0,null:0,strictEq:0,strictNe:0,as:0,unknown:0};
  function visit(n){
    if(n.kind===ts.SyntaxKind.IfStatement)c.if++;
    if(n.kind===ts.SyntaxKind.ForStatement || n.kind===ts.SyntaxKind.ForOfStatement || n.kind===ts.SyntaxKind.ForInStatement)c.for++;
    if(n.kind===ts.SyntaxKind.WhileStatement || n.kind===ts.SyntaxKind.DoStatement)c.while++;
    if(n.kind===ts.SyntaxKind.SwitchStatement)c.switch++;
    if(n.kind===ts.SyntaxKind.AsExpression)c.as++;
    if(n.kind===ts.SyntaxKind.NullKeyword)c.null++;
    if(n.kind===ts.SyntaxKind.UnknownKeyword)c.unknown++;
    if(n.kind===ts.SyntaxKind.Identifier && n.text==='undefined')c.undefined++;
    if(n.kind===ts.SyntaxKind.BinaryExpression){
      const op=n.operatorToken.kind;
      if(op===ts.SyntaxKind.EqualsEqualsEqualsToken)c.strictEq++;
      if(op===ts.SyntaxKind.ExclamationEqualsEqualsToken)c.strictNe++;
    }
    if(n.kind===ts.SyntaxKind.PropertyAccessExpression){
      const name=n.name.text;
      if(Object.prototype.hasOwnProperty.call(c,name))c[name]++;
    }
    ts.forEachChild(n,visit);
  }
  visit(sf);
  for(const k of Object.keys(forbidden)) forbidden[k]+=c[k];
  if(Object.values(c).some(Boolean)) violations.push({file:path.relative(root,file),...c});
}
console.log(JSON.stringify({phase:376,files,totals:forbidden,violations:violations.sort((a,b)=>Object.values(b).reduce((x,y)=>x+y,0)-Object.values(a).reduce((x,y)=>x+y,0))},null,2));
