const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const roots = [
  'packages/core/src/compiler/scanner',
  'packages/core/src/types/domain/resourceModelMethodResolver.ts',
  'packages/core/src/types/domain/resourceModelMethodResolverMeaning.ts',
  'packages/core/src/types/domain/resourceModelMethodResolverProjection.ts',
  'packages/core/src/types/domain/resourceModelMethodResolverOperation.ts',
  'packages/core/src/types/domain/resourceModelSurface.ts',
  'packages/core/src/ir/domain/SemanticTypeResolvers.ts',
];
const files=[];
const collect=e=>{if(!fs.existsSync(e))return;const s=fs.statSync(e);if(s.isFile()){if(e.endsWith('.ts')&&!e.endsWith('.d.ts')&&!e.includes('__tests__')&&!e.includes('__test__')&&!e.endsWith('.test.ts')&&!e.endsWith('.spec.ts'))files.push(e);return;}for(const c of fs.readdirSync(e,{withFileTypes:true}))collect(path.join(e,c.name));};
roots.forEach(collect);
const statementKinds=new Map([['if',ts.SyntaxKind.IfStatement],['for',ts.SyntaxKind.ForStatement],['while',ts.SyntaxKind.WhileStatement],['switch',ts.SyntaxKind.SwitchStatement],['ternary',ts.SyntaxKind.ConditionalExpression]]);
const properties=new Set(['map','filter','reduce','flatMap','trim','slice']);
const binary=new Set(['??','===','!==','&&','||']);
const inspect=file=>{const source=fs.readFileSync(file,'utf8');const sf=ts.createSourceFile(file,source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TS);const keys=[...statementKinds.keys(),...binary,'as unknown','undefined','never','map','filter','reduce','flatMap','trim','slice','null'];const counts=Object.fromEntries(keys.map(k=>[k,0]));const visit=node=>{for(const[k,kind]of statementKinds)if(node.kind===kind)counts[k]++;if(ts.isBinaryExpression(node)){const op=node.operatorToken.getText(sf);if(binary.has(op))counts[op]++;}if(ts.isAsExpression(node)&&node.type.kind===ts.SyntaxKind.UnknownKeyword)counts['as unknown']++;if(ts.isIdentifier(node)&&node.text==='undefined')counts.undefined++;if(node.kind===ts.SyntaxKind.NeverKeyword)counts.never++;if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&properties.has(node.expression.name.text))counts[node.expression.name.text]++;ts.forEachChild(node,visit)};visit(sf);const t=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true,fileName:file});return{counts,transpileDiagnostics:(t.diagnostics||[]).map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))};};
const results=Object.fromEntries(files.map(f=>[f,inspect(f)]));
const leaks=Object.entries(results).filter(([,r])=>Object.entries(r.counts).some(([k,v])=>k!=='null'&&v>0));
const diagnostics=Object.entries(results).filter(([,r])=>r.transpileDiagnostics.length);
const payload={phase:559,frontier:'scanner-lexer-plus-resolver-graph-model-domain',scannedFiles:files.length,hostLeakCount:leaks.reduce((s,[,r])=>s+Object.entries(r.counts).filter(([k])=>k!=='null').reduce((a,[,v])=>a+v,0),0),leakingFiles:leaks.map(([file,r])=>({file,counts:Object.fromEntries(Object.entries(r.counts).filter(([k,v])=>k!=='null'&&v>0))})),modelEvidence:Object.entries(results).filter(([,r])=>r.counts.null>0||r.counts.never>0).map(([file,r])=>({file,null:r.counts.null,never:r.counts.never})),transpileDiagnosticsClean:diagnostics.length===0,transpileDiagnostics:diagnostics,closedSurfaceClean:leaks.length===0&&diagnostics.length===0};
console.log(JSON.stringify(payload,null,2));
if(!payload.closedSurfaceClean)process.exit(1);
