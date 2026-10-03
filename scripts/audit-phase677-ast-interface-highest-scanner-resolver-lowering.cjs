const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const ROOT = process.cwd();
const files = [
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteInterface.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxJudgmentRewriteEngine.ts',
  'packages/core/src/compiler/scanner/lexer/phpAstAlgebra.ts',
  'packages/core/src/compiler/scanner/lexer/astClassifierEvidence.ts',
  'packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasics.ts',
  'packages/core/src/compiler/scanner/resolvers/RouteDomainResolver.ts',
  'packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts',
  'packages/core/src/compiler/analysis/astAnalysisInterface.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptLoweringSemanticRelations.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptNodeLowerer.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceAstExpressionMapper.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceUpstreamExpressionMappings.ts',
  'packages/core/src/compiler/scanner/subscanners/serviceSourceStatements.ts',
];
const inspect = file => {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const out = { if:0, while:0, for:0, switch:0, map:0, filter:0, reduce:0, flatMap:0, undefined:0, nullish:0, strictEquality:0, strictInequality:0, unknownCast:0, extract:0, any:0, null:0, set:0, mapConstruction:0, conditional:0, optional:0, nonNull:0, length:0, split:0, regex:0 };
  const visit = n => {
    if (n.kind === ts.SyntaxKind.IfStatement) out.if++;
    if (n.kind === ts.SyntaxKind.WhileStatement || n.kind === ts.SyntaxKind.DoStatement) out.while++;
    if (n.kind === ts.SyntaxKind.ForStatement || n.kind === ts.SyntaxKind.ForInStatement || n.kind === ts.SyntaxKind.ForOfStatement) out.for++;
    if (n.kind === ts.SyntaxKind.SwitchStatement) out.switch++;
    if (n.kind === ts.SyntaxKind.ConditionalExpression) out.conditional++;
    if (n.kind === ts.SyntaxKind.QuestionDotToken || n.kind === ts.SyntaxKind.QuestionToken) out.optional++;
    if (n.kind === ts.SyntaxKind.NonNullExpression) out.nonNull++;
    if (n.kind === ts.SyntaxKind.Identifier && n.text === 'undefined') out.undefined++;
    if (n.kind === ts.SyntaxKind.BinaryExpression) {
      if (n.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) out.nullish++;
      if (n.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) out.strictEquality++;
      if (n.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) out.strictInequality++;
    }
    if (n.kind === ts.SyntaxKind.CallExpression && ts.isPropertyAccessExpression(n.expression)) {
      const x = n.expression.name.text;
      if (x === 'map') out.map++; if (x === 'filter') out.filter++; if (x === 'reduce') out.reduce++; if (x === 'flatMap') out.flatMap++; if (x === 'split') out.split++;
    }
    if (n.kind === ts.SyntaxKind.PropertyAccessExpression && n.name.text === 'length') out.length++;
    if (n.kind === ts.SyntaxKind.RegularExpressionLiteral) out.regex++;
    if (n.kind === ts.SyntaxKind.AsExpression && n.type.getText(sf) === 'unknown') out.unknownCast++;
    if (n.kind === ts.SyntaxKind.AsExpression && n.type.getText(sf).startsWith('Extract<')) out.extract++;
    if (n.kind === ts.SyntaxKind.TypeReference && n.typeName.getText(sf) === 'Extract') out.extract++;
    if (n.kind === ts.SyntaxKind.AnyKeyword) out.any++;
    if (n.kind === ts.SyntaxKind.NullKeyword) out.null++;
    if (n.kind === ts.SyntaxKind.NewExpression) { const x = n.expression.getText(sf); if (x === 'Set') out.set++; if (x === 'Map') out.mapConstruction++; }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  const diagnostics = (ts.transpileModule(source, { compilerOptions:{ target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.CommonJS }, reportDiagnostics:true, fileName:file }).diagnostics || []).map(d => ts.flattenDiagnosticMessageText(d.messageText, ' '));
  return { counts: out, transpileDiagnostics: diagnostics };
};
const reports = Object.fromEntries(files.map(f => [f, inspect(f)]));
const authorities = {
  closedRewriteInterface: fs.readFileSync(path.join(ROOT, files[0]), 'utf8').includes("authority: 'closed_semantic_rewrite_interface'") || fs.readFileSync(path.join(ROOT, files[0]), 'utf8').includes('closed_semantic_rewrite_interface'),
  syntaxFixedPoint: fs.readFileSync(path.join(ROOT, files[1]), 'utf8').includes('relationFixedPoint'),
  ternaryConstructor: fs.readFileSync(path.join(ROOT, files[3]), 'utf8').includes('PhpAstFactory.ternaryExpression'),
  boundaryBasicsJudgment: fs.readFileSync(path.join(ROOT, files[4]), 'utf8').includes("authority: 'route_boundary_basics_judgment'"),
  resolverGraphRewrite: fs.readFileSync(path.join(ROOT, files[6]), 'utf8').includes('solveClosedSemanticRelations'),
  analysisTypeJudgment: fs.readFileSync(path.join(ROOT, files[7]), 'utf8').includes("authority: 'ast_analysis_type_judgment'"),
  loweringConsumesAnalysis: fs.readFileSync(path.join(ROOT, files[8]), 'utf8').includes('resolveTypeScriptLoweringFromType'),
};
const cleanFiles = Object.values(reports).every(r => Object.values(r.counts).every(v => v === 0) && r.transpileDiagnostics.length === 0);
const success = cleanFiles && Object.values(authorities).every(Boolean);
console.log(JSON.stringify({ phase:677, model:'closed AST ADT -> closed rewrite terms -> scanner semantic evidence -> resolver graph closure -> analysis type judgment -> target lowering', reports, authorities, success }, null, 2));
process.exitCode = success ? 0 : 1;
