const fs=require('fs');const ts=require('typescript');
const files=[
'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
'packages/core/src/semantic/kernel/syntax/parserAdapterRelations.ts',
'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
'packages/core/src/compiler/scanner/semantic/route/routeBindingAstAdapter.ts',
'packages/core/src/compiler/scanner/semantic/route/routeConstraintAstAdapter.ts',
'packages/core/src/compiler/scanner/semantic/route/routeResourceAstAdapter.ts',
'packages/core/src/compiler/scanner/semantic/route/routeMiddlewareAstAdapter.ts',
'packages/core/src/compiler/scanner/semantic/route/routeBindingSemanticResolver.ts',
'packages/core/src/compiler/scanner/semantic/route/routeResourceSemanticResolver.ts',
'packages/core/src/compiler/scanner/semantic/route/routeMiddlewareResolver.ts',
'packages/core/src/compiler/scanner/semantic/route/routeSemanticFlowResolver.ts',
'packages/core/src/compiler/scanner/resolvers/resource/ResourceModelResolver.ts',
'packages/core/src/compiler/scanner/subscanners/controller/resourceDataflowAggregator.ts',
'packages/core/src/compiler/scanner/subscanners/resource/twoPassRelationResolver.ts',
];
const out={phase:382,files:files.length,counts:{if:0,for:0,while:0,switch:0,map:0,filter:0,reduce:0,flatMap:0,undefined:0,qq:0,null:0,eqeqeq:0,neqeq:0,as:0,unknown:0},perFile:{}};
for(const file of files){const text=fs.readFileSync(file,'utf8');const sf=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);const c={if:0,for:0,while:0,switch:0,map:0,filter:0,reduce:0,flatMap:0,undefined:0,qq:0,null:0,eqeqeq:0,neqeq:0,as:0,unknown:0};
 const visit=n=>{if(n.kind===ts.SyntaxKind.IfStatement)c.if++;if(n.kind===ts.SyntaxKind.ForStatement||n.kind===ts.SyntaxKind.ForOfStatement||n.kind===ts.SyntaxKind.ForInStatement)c.for++;if(n.kind===ts.SyntaxKind.WhileStatement||n.kind===ts.SyntaxKind.DoStatement)c.while++;if(n.kind===ts.SyntaxKind.SwitchStatement)c.switch++;if(n.kind===ts.SyntaxKind.AsExpression)c.as++;if(n.kind===ts.SyntaxKind.QuestionQuestionToken)c.qq++;if(n.kind===ts.SyntaxKind.NullKeyword)c.null++;if(n.kind===ts.SyntaxKind.UnknownKeyword)c.unknown++;if(n.kind===ts.SyntaxKind.BinaryExpression){const op=n.operatorToken.kind;if(op===ts.SyntaxKind.EqualsEqualsEqualsToken)c.eqeqeq++;if(op===ts.SyntaxKind.ExclamationEqualsEqualsToken)c.neqeq++;}if(n.kind===ts.SyntaxKind.CallExpression&&n.expression.kind===ts.SyntaxKind.PropertyAccessExpression){const name=n.expression.name.text;if(['map','filter','reduce','flatMap'].includes(name))c[name]++;}ts.forEachChild(n,visit)};visit(sf);out.perFile[file]=c;for(const k of Object.keys(c))out.counts[k]+=c[k];}
console.log(JSON.stringify(out,null,2));
