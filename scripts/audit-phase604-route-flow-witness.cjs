const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const root = path.join(process.cwd(), 'packages/core/src');
const frontier = [
  'compiler/scanner/descriptors/route/RouteSemanticFlowFactory.ts',
  'compiler/scanner/descriptors/route/routeDeclarations.ts',
  'compiler/scanner/descriptors/route/routeMutations.ts',
  'compiler/scanner/descriptors/route/factories/contractRouteFactories.ts',
  'compiler/scanner/subscanners/InvalidationResolver.ts',
];
const files=[];
function walk(d){ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name); if(e.isDirectory()) walk(p); else if(e.isFile()&&p.endsWith('.ts')&&!p.endsWith('.test.ts')) files.push(p); } }
walk(root);
const keys=['if','while','for','switch','map','filter','reduce','flatMap','undefined','null','nullish','eq','neq','asUnknown','Set','Map','any','new','ternary'];
function audit(file){
  const sf=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
  const c=Object.fromEntries(keys.map(k=>[k,0]));
  function v(n){
    if(n.kind===ts.SyntaxKind.IfStatement)c.if++;
    if(n.kind===ts.SyntaxKind.WhileStatement)c.while++;
    if(n.kind===ts.SyntaxKind.ForStatement||n.kind===ts.SyntaxKind.ForOfStatement||n.kind===ts.SyntaxKind.ForInStatement)c.for++;
    if(n.kind===ts.SyntaxKind.SwitchStatement)c.switch++;
    if(n.kind===ts.SyntaxKind.ConditionalExpression)c.ternary++;
    if(n.kind===ts.SyntaxKind.NewExpression)c.new++;
    if(n.kind===ts.SyntaxKind.BinaryExpression){const op=n.operatorToken.kind;if(op===ts.SyntaxKind.QuestionQuestionToken)c.nullish++;if(op===ts.SyntaxKind.EqualsEqualsEqualsToken)c.eq++;if(op===ts.SyntaxKind.ExclamationEqualsEqualsToken)c.neq++;}
    if(n.kind===ts.SyntaxKind.AsExpression&&n.type.kind===ts.SyntaxKind.UnknownKeyword)c.asUnknown++;
    if(n.kind===ts.SyntaxKind.Identifier){const x=n.text;if(x==='undefined')c.undefined++;if(x==='null')c.null++;if(x==='Set')c.Set++;if(x==='Map')c.Map++;if(x==='any')c.any++;}
    if(ts.isPropertyAccessExpression(n)){const x=n.name.text;if(['map','filter','reduce','flatMap'].includes(x))c[x]++;}
    ts.forEachChild(n,v);
  }
  v(sf); return c;
}
const frontierReport=Object.fromEntries(frontier.map(f=>[f,audit(path.join(root,f))]));
const global=Object.fromEntries(keys.map(k=>[k,0]));
for(const f of files){const c=audit(f); for(const k of keys)global[k]+=c[k];}
const zeroBytes=files.filter(f=>fs.statSync(f).size===0).map(f=>path.relative(root,f));
const report={phase:604,description:'RouteSemanticFlow structural witness and constructor-authority cutover',productionFiles:files.length,zeroByteProductionFiles:zeroBytes.length,zeroByteFiles:zeroBytes,frontier:frontierReport,global};
fs.writeFileSync('docs/PHASE604_ROUTE_FLOW_WITNESS_AUDIT.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
