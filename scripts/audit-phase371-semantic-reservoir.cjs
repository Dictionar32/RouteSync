const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const roots = [
  'packages/core/src/semantic',
  'packages/core/src/compiler/scanner/lexer/routeAst',
  'packages/core/src/compiler/scanner/subscanners',
];
const excluded = /(__tests__|__test__|\.spec\.ts$|\.test\.ts$)/;
const files = roots.flatMap(rel => {
  const base = path.join(root, rel);
  const out=[];
  const walk=d=>fs.readdirSync(d,{withFileTypes:true}).forEach(e=>{const p=path.join(d,e.name); if(e.isDirectory()) walk(p); else if(e.isFile()&&e.name.endsWith('.ts')&&!excluded.test(p)) out.push(p);});
  walk(base); return out;
});
const counts=Object.create(null);
const examples=[];
for(const file of files){
  const sf=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
  const add=(kind,node)=>{counts[kind]=(counts[kind]||0)+1; if(examples.length<80) examples.push({file:path.relative(root,file),kind,line:sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1,text:node.getText(sf).slice(0,180)});};
  const visit=n=>{
    if(n.kind===ts.SyntaxKind.IfStatement)add('if',n);
    if([ts.SyntaxKind.ForStatement,ts.SyntaxKind.ForInStatement,ts.SyntaxKind.ForOfStatement].includes(n.kind))add('for',n);
    if([ts.SyntaxKind.WhileStatement,ts.SyntaxKind.DoStatement].includes(n.kind))add('while',n);
    if(n.kind===ts.SyntaxKind.SwitchStatement)add('switch',n);
    if(n.kind===ts.SyntaxKind.AsExpression)add('as',n);
    if(n.kind===ts.SyntaxKind.UnknownKeyword)add('unknownType',n);
    if(n.kind===ts.SyntaxKind.NullKeyword)add('null',n);
    if(n.kind===ts.SyntaxKind.Identifier&&n.text==='undefined')add('undefined',n);
    if(n.kind===ts.SyntaxKind.BinaryExpression){if(n.operatorToken.kind===ts.SyntaxKind.EqualsEqualsEqualsToken)add('strictEqual',n.operatorToken);if(n.operatorToken.kind===ts.SyntaxKind.ExclamationEqualsEqualsToken)add('strictNotEqual',n.operatorToken);if(n.operatorToken.kind===ts.SyntaxKind.QuestionQuestionToken)add('nullish',n.operatorToken);}
    if(n.kind===ts.SyntaxKind.CallExpression&&ts.isPropertyAccessExpression(n.expression)&&['map','filter','reduce','flatMap'].includes(n.expression.name.text))add(n.expression.name.text,n);
    ts.forEachChild(n,visit);
  }; ts.forEachChild(sf,visit);
}
console.log(JSON.stringify({phase:371,files:files.length,counts,examples},null,2));
