const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const root = path.join(process.cwd(), 'packages/core/src');
const frontier = [
  'types/domain/responseDescriptors.ts',
  'compiler/scanner/subscanners/controller/responseAttributeScanner.ts',
  'compiler/scanner/subscanners/controller/resourceInvocationDetector.ts',
  'compiler/scanner/subscanners/controller/responseDetector.ts',
  'compiler/scanner/descriptors/route/factories/syntheticRouteFactory.ts',
];
const files=[];
function walk(d){ for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name); if(e.isDirectory()) walk(p); else if(e.isFile()&&p.endsWith('.ts')&&!p.endsWith('.test.ts')) files.push(p); } }
walk(root);
const banned = {if:0,while:0,for:0,switch:0,map:0,filter:0,reduce:0,flatMap:0,undefined:0,null:0,nullish:0,eq:0,neq:0,asUnknown:0,Set:0,Map:0,any:0,new:0,ternary:0};
function audit(file){ const source=fs.readFileSync(file,'utf8'); const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true); const c=Object.fromEntries(Object.keys(banned).map(k=>[k,0])); function v(n){
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
 } v(sf); return c; }
const frontierReport=Object.fromEntries(frontier.map(f=>[f,audit(path.join(root,f))]));
for(const f of files){const c=audit(f); for(const k of Object.keys(banned))banned[k]+=c[k];}
const report={phase:603,description:'response descriptor algebra cutover',productionFiles:files.length,zeroByteProductionFiles:files.filter(f=>fs.statSync(f).size===0).length,frontier:frontierReport,global:banned,constructorLeaksInResponseDescriptors:files.filter(f=>/types\/domain\/responseDescriptors\.ts$/.test(f)).map(f=>({file:f,constructors:audit(f).new}))};
fs.writeFileSync('docs/PHASE603_RESPONSE_DESCRIPTOR_ALGEBRA_AUDIT.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
