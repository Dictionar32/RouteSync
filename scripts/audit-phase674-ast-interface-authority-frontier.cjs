const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const ROOT = process.cwd();
const boundary = [
  'packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts',
  'packages/core/src/compiler/scanner/resolvers/RouteDomainResolver.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptLoweringSemanticRelations.ts',
  'packages/core/src/compiler/analysis/astAnalysisInterface.ts',
  'packages/core/src/compiler/analysis/ssa/ssaSemanticInterface.ts',
  'packages/core/src/compiler/analysis/ssa/ssaRenamer.ts',
  'packages/core/src/compiler/analysis/ssa/ssaBuilder.ts',
  'packages/core/src/compiler/analysis/ssa/renamer/variableVersionScope.ts',
  'packages/core/src/compiler/analysis/loop/loopNormalizer.ts',
  'packages/core/src/compiler/utils/cfg/instructions.ts',
];
const forbidden = file => {
  const source = fs.readFileSync(path.join(ROOT,file),'utf8');
  const sf = ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  const out={if:0,while:0,for:0,switch:0,map:0,filter:0,reduce:0,flatMap:0,undefined:0,nullish:0,strictEquality:0,strictInequality:0,unknownCast:0,extractCast:0,anyKeyword:0,nullKeyword:0,setConstruction:0,mapConstruction:0,conditional:0,optional:0,extractType:0};
  const visit=n=>{if(n.kind===ts.SyntaxKind.IfStatement)out.if++;if(n.kind===ts.SyntaxKind.WhileStatement||n.kind===ts.SyntaxKind.DoStatement)out.while++;if(n.kind===ts.SyntaxKind.ForStatement||n.kind===ts.SyntaxKind.ForInStatement||n.kind===ts.SyntaxKind.ForOfStatement)out.for++;if(n.kind===ts.SyntaxKind.SwitchStatement)out.switch++;if(n.kind===ts.SyntaxKind.ConditionalExpression)out.conditional++;if(n.kind===ts.SyntaxKind.QuestionDotToken||n.kind===ts.SyntaxKind.QuestionToken)out.optional++;if(n.kind===ts.SyntaxKind.Identifier&&n.text==='undefined')out.undefined++;if(n.kind===ts.SyntaxKind.BinaryExpression){const k=n.operatorToken.kind;if(k===ts.SyntaxKind.QuestionQuestionToken)out.nullish++;if(k===ts.SyntaxKind.EqualsEqualsEqualsToken)out.strictEquality++;if(k===ts.SyntaxKind.ExclamationEqualsEqualsToken)out.strictInequality++;}if(n.kind===ts.SyntaxKind.CallExpression&&ts.isPropertyAccessExpression(n.expression)){const x=n.expression.name.text;if(x==='map')out.map++;if(x==='filter')out.filter++;if(x==='reduce')out.reduce++;if(x==='flatMap')out.flatMap++;}if(n.kind===ts.SyntaxKind.AsExpression){const t=n.type.getText(sf);if(t==='unknown')out.unknownCast++;if(t.startsWith('Extract<'))out.extractCast++;}if(n.kind===ts.SyntaxKind.TypeReference&&n.typeName.getText(sf)==='Extract')out.extractType++;if(n.kind===ts.SyntaxKind.AnyKeyword)out.anyKeyword++;if(n.kind===ts.SyntaxKind.NullKeyword)out.nullKeyword++;if(n.kind===ts.SyntaxKind.NewExpression){const x=n.expression.getText(sf);if(x==='Set')out.setConstruction++;if(x==='Map')out.mapConstruction++;}ts.forEachChild(n,visit)};visit(sf);return out;
};
const reports=Object.fromEntries(boundary.map(f=>[f,forbidden(f)]));
const resolver=fs.readFileSync(path.join(ROOT,boundary[0]),'utf8');
const lowering=fs.readFileSync(path.join(ROOT,boundary[2]),'utf8');
const analysis=fs.readFileSync(path.join(ROOT,boundary[3]),'utf8');
const ssa=fs.readFileSync(path.join(ROOT,boundary[4]),'utf8');
const cfg=fs.readFileSync(path.join(ROOT,boundary[9]),'utf8');
const clean=Object.values(reports).every(r=>Object.values(r).every(v=>v===0));
const success=clean&&resolver.includes("authority: 'resolver_graph_judgment'")&&resolver.includes('least_fixed_point')&&lowering.includes('TypeScriptLoweringLegality')&&analysis.includes("kind: 'ast_analysis_judgment'")&&ssa.includes("kind: 'ssa_semantic_judgment'")&&cfg.includes("value: import('./constants').ConstantValue;");
console.log(JSON.stringify({phase:674,model:'highest AST semantic authority frontier: resolver graph + analysis judgment + target legality + typed CFG operands',resolverGraphAuthority:resolver.includes("authority: 'resolver_graph_judgment'"),analysisAuthority:analysis.includes("kind: 'ast_analysis_judgment'"),ssaAuthority:ssa.includes("kind: 'ssa_semantic_judgment'"),targetLegality:lowering.includes('TypeScriptLoweringLegality'),typedConstantOperand:cfg.includes("value: import('./constants').ConstantValue;"),boundary:reports,success},null,2));
process.exitCode=success?0:1;
