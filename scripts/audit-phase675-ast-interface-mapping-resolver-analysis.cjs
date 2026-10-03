const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const ROOT = process.cwd();
const boundaries = [
  'packages/core/src/types/upstream/astMappingInterface.ts',
  'packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts',
  'packages/core/src/compiler/scanner/subscanners/resource/resourceSemanticMappingRelations.ts',
  'packages/core/src/compiler/scanner/resolvers/resolverGraphSemanticInterface.ts',
  'packages/core/src/compiler/scanner/resolvers/boundary/capabilityResolution.ts',
  'packages/core/src/compiler/analysis/astAnalysisInterface.ts',
  'packages/core/src/compiler/domain/common/ts-lowerer/typeScriptLoweringSemanticRelations.ts',
];
const forbidden = file => {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const out = { if: 0, while: 0, for: 0, switch: 0, map: 0, filter: 0, reduce: 0, flatMap: 0, undefined: 0, nullish: 0, strictEquality: 0, strictInequality: 0, unknownCast: 0, extractCast: 0, extractType: 0, anyKeyword: 0, nullKeyword: 0, setConstruction: 0, mapConstruction: 0, conditional: 0, optional: 0 };
  const visit = node => {
    if (node.kind === ts.SyntaxKind.IfStatement) out.if++;
    if (node.kind === ts.SyntaxKind.WhileStatement || node.kind === ts.SyntaxKind.DoStatement) out.while++;
    if (node.kind === ts.SyntaxKind.ForStatement || node.kind === ts.SyntaxKind.ForInStatement || node.kind === ts.SyntaxKind.ForOfStatement) out.for++;
    if (node.kind === ts.SyntaxKind.SwitchStatement) out.switch++;
    if (node.kind === ts.SyntaxKind.ConditionalExpression) out.conditional++;
    if (node.kind === ts.SyntaxKind.QuestionDotToken || node.kind === ts.SyntaxKind.QuestionToken) out.optional++;
    if (node.kind === ts.SyntaxKind.Identifier && node.text === 'undefined') out.undefined++;
    if (node.kind === ts.SyntaxKind.BinaryExpression) {
      if (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) out.nullish++;
      if (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) out.strictEquality++;
      if (node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) out.strictInequality++;
    }
    if (node.kind === ts.SyntaxKind.CallExpression && ts.isPropertyAccessExpression(node.expression)) {
      const name = node.expression.name.text;
      if (name === 'map') out.map++;
      if (name === 'filter') out.filter++;
      if (name === 'reduce') out.reduce++;
      if (name === 'flatMap') out.flatMap++;
    }
    if (node.kind === ts.SyntaxKind.AsExpression) {
      const type = node.type.getText(sf);
      if (type === 'unknown') out.unknownCast++;
      if (type.startsWith('Extract<')) out.extractCast++;
    }
    if (node.kind === ts.SyntaxKind.TypeReference && node.typeName.getText(sf) === 'Extract') out.extractType++;
    if (node.kind === ts.SyntaxKind.AnyKeyword) out.anyKeyword++;
    if (node.kind === ts.SyntaxKind.NullKeyword) out.nullKeyword++;
    if (node.kind === ts.SyntaxKind.NewExpression) {
      const name = node.expression.getText(sf);
      if (name === 'Set') out.setConstruction++;
      if (name === 'Map') out.mapConstruction++;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
};
const reports = Object.fromEntries(boundaries.map(file => [file, forbidden(file)]));
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const mapping = read(boundaries[0]);
const resource = read(boundaries[2]);
const resolver = read(boundaries[3]);
const capability = read(boundaries[4]);
const analysis = read(boundaries[5]);
const lowering = read(boundaries[6]);
const semanticAuthority = [
  mapping.includes("authority: 'ast_mapping_judgment'"),
  mapping.includes("closure: 'least_fixed_point'"),
  mapping.includes("reasoning: 'declarative_relation_rewrite_fixed_point'"),
  resource.includes('resolveResourceAstMappingInterface'),
  resolver.includes("readonly mapping: AstMappingInterface['judgment']"),
  resolver.includes('const mapping = input.mapping.judgment'),
  capability.includes('RouteCapabilitySemanticInput'),
  capability.includes('Presence<RouteHookKindType>'),
  analysis.includes("kind: 'semantic_type'"),
  lowering.includes('resolveTypeScriptLoweringFromAnalysis'),
];
const clean = Object.values(reports).every(report => Object.values(report).every(value => value === 0));
const success = clean && semanticAuthority.every(Boolean);
console.log(JSON.stringify({ phase: 675, model: 'AST ADT highest mapping -> resolver -> analysis -> lowering authority', boundaries: reports, semanticAuthority, success }, null, 2));
process.exitCode = success ? 0 : 1;
