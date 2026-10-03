const fs=require('fs'),path=require('path'),ts=require('typescript');
const root=path.join(__dirname,'..','packages','core','src');
const banned={if:0,while:0,for:0,switch:0,map:0,filter:0,reduce:0,flatMap:0,undefined:0,null:0,coalesce:0,eq:0,neq:0,asUnknown:0,Set:0,Map:0,any:0,new:0,ternary:0};
const files=[];
function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())walk(f);else if(e.name.endsWith('.ts'))files.push(f)}} walk(root);
function visit(n){
 if(n.kind===ts.SyntaxKind.IfStatement)banned.if++;
 if(n.kind===ts.SyntaxKind.WhileStatement)banned.while++;
 if(n.kind===ts.SyntaxKind.ForStatement)banned.for++;
 if(n.kind===ts.SyntaxKind.SwitchStatement)banned.switch++;
 if(n.kind===ts.SyntaxKind.ConditionalExpression)banned.ternary++;
 if(n.kind===ts.SyntaxKind.NewExpression)banned.new++;
 if(n.kind===ts.SyntaxKind.BinaryExpression){const op=n.operatorToken.kind;if(op===ts.SyntaxKind.QuestionQuestionToken)banned.coalesce++;if(op===ts.SyntaxKind.EqualsEqualsEqualsToken)banned.eq++;if(op===ts.SyntaxKind.ExclamationEqualsEqualsToken)banned.neq++;}
 if(n.kind===ts.SyntaxKind.AsExpression && n.type.kind===ts.SyntaxKind.UnknownKeyword)banned.asUnknown++;
 if(ts.isIdentifier(n)){if(n.text==='Set')banned.Set++;if(n.text==='Map')banned.Map++;if(n.text==='any')banned.any++;if(n.text==='undefined')banned.undefined++;if(n.text==='null')banned.null++;}
 if(ts.isPropertyAccessExpression(n)){const x=n.name.text;if(x==='map')banned.map++;if(x==='filter')banned.filter++;if(x==='reduce')banned.reduce++;if(x==='flatMap')banned.flatMap++;}
 ts.forEachChild(n,visit);
}
for(const f of files){const s=fs.readFileSync(f,'utf8');const sf=ts.createSourceFile(f,s,ts.ScriptTarget.Latest,true);visit(sf)}
const production=files.filter(f=>!f.endsWith('.test.ts')).length;
const frontierFiles=files.filter(f=>/\/(compiler\/scanner|semantic\/plugins|types\/upstream)\//.test(f)&&!f.endsWith('.test.ts'));
const frontier={};
for(const f of frontierFiles){const source=fs.readFileSync(f,'utf8');const sf=ts.createSourceFile(f,source,ts.ScriptTarget.Latest,true);const local={...Object.fromEntries(Object.keys(banned).map(k=>[k,0]))};const old={...banned};for(const k of Object.keys(banned))banned[k]=0;visit(sf);Object.assign(local,banned);Object.assign(banned,old);frontier[f.replace(root,'')]=local;}
const out={phase:602,productionFiles:production,zeroByteProduction:files.filter(f=>!f.endsWith('.test.ts')&&fs.statSync(f).size===0).length,globalAst:banned,frontier,modified:['packages/core/src/compiler/scanner/lexer/phpAstFactory.ts','packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts'],removed:['packages/core/src/types/semantic/__archive__/parsedAstTypes.ts'],validation:'targeted transpile: 0 diagnostics; full tsc blocked by missing node and vitest/globals definitions'};
fs.writeFileSync(path.join(root,'..','..','..','docs','PHASE602_SCANNER_RELATIONAL_FRONTIER_AUDIT.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
