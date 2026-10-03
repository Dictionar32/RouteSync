const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const ROOT = process.cwd();
const files = [
  'packages/core/src/compiler/scanner/resolvers/boundary/boundaryBasics.ts',
  'packages/core/src/compiler/scanner/resolvers/boundary/boundaryInputResolution.ts',
  'packages/core/src/compiler/scanner/resolvers/boundary/capabilityBuilder.ts',
  'packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts',
  'packages/core/src/compiler/analysis/astAnalysisInterface.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptLoweringSemanticRelations.ts',
  'packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts',
  'packages/core/src/compiler/scanner/lexer/astClassifierEvidence.ts',
];
const inspect = file => {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const out = { if:0, while:0, for:0, switch:0, map:0, filter:0, reduce:0, flatMap:0, undefined:0, nullish:0, strictEquality:0, strictInequality:0, unknownCast:0, extractCast:0, anyKeyword:0, nullKeyword:0, setConstruction:0, mapConstruction:0, conditional:0, optional:0, nonNull:0 };
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
      const k = n.operatorToken.kind;
      if (k === ts.SyntaxKind.QuestionQuestionToken) out.nullish++;
      if (k === ts.SyntaxKind.EqualsEqualsEqualsToken) out.strictEquality++;
      if (k === ts.SyntaxKind.ExclamationEqualsEqualsToken) out.strictInequality++;
    }
    if (n.kind === ts.SyntaxKind.CallExpression && ts.isPropertyAccessExpression(n.expression)) {
      const x = n.expression.name.text;
      if (x === 'map') out.map++; if (x === 'filter') out.filter++; if (x === 'reduce') out.reduce++; if (x === 'flatMap') out.flatMap++;
    }
    if (n.kind === ts.SyntaxKind.AsExpression && n.type.getText(sf) === 'unknown') out.unknownCast++;
    if (n.kind === ts.SyntaxKind.AsExpression && n.type.getText(sf).startsWith('Extract<')) out.extractCast++;
    if (n.kind === ts.SyntaxKind.TypeReference && n.typeName.getText(sf) === 'Extract') out.extractCast++;
    if (n.kind === ts.SyntaxKind.AnyKeyword) out.anyKeyword++;
    if (n.kind === ts.SyntaxKind.NullKeyword) out.nullKeyword++;
    if (n.kind === ts.SyntaxKind.NewExpression) { const x = n.expression.getText(sf); if (x === 'Set') out.setConstruction++; if (x === 'Map') out.mapConstruction++; }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  const transpiled = ts.transpileModule(source, { compilerOptions:{ target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.CommonJS }, reportDiagnostics:true, fileName:file });
  return { counts: out, transpileDiagnostics:(transpiled.diagnostics || []).map(d => ts.flattenDiagnosticMessageText(d.messageText, ' ')) };
};
const reports = Object.fromEntries(files.map(f => [f, inspect(f)]));
const clean = Object.values(reports).every(r => Object.values(r.counts).every(v => v === 0) && r.transpileDiagnostics.length === 0);
const query = fs.readFileSync(path.join(ROOT, files[6]), 'utf8');
const classifier = fs.readFileSync(path.join(ROOT, files[7]), 'utf8');
const resolver = fs.readFileSync(path.join(ROOT, files[3]), 'utf8');
const analysis = fs.readFileSync(path.join(ROOT, files[4]), 'utf8');
const basics = fs.readFileSync(path.join(ROOT, files[0]), 'utf8');
const success = clean && query.includes('relationVariantValue') && !query.includes('as unknown') && basics.includes("authority: 'route_boundary_basics_judgment'") && resolver.includes("authority: 'resolver_graph_judgment'") && resolver.includes('solveSemanticRelations') && analysis.includes("authority: 'ast_analysis_judgment'") && analysis.includes('ResolverGraphSemanticJudgment') && analysis.includes("kind: 'dataflow_relation'");
console.log(JSON.stringify({ phase:676, model:'AST ADT highest boundary -> resolver graph relation closure -> analysis relation algebra -> lowering', reports, authorities:{boundaryBasics:basics.includes("authority: 'route_boundary_basics_judgment'"),resolverGraph:resolver.includes("authority: 'resolver_graph_judgment'"),analysis:analysis.includes("authority: 'ast_analysis_judgment'"),dataflowRelation:analysis.includes("kind: 'dataflow_relation'"),resolverRewrite:resolver.includes('solveSemanticRelations'),scannerQueryConstructFree:query.includes('relationVariantValue'),classifierConstructFree:reports[files[7]].counts.nonNull === 0 && reports[files[7]].counts.conditional === 0 && reports[files[7]].counts.optional === 0,}, success }, null, 2));
process.exitCode = success ? 0 : 1;
