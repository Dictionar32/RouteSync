const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = process.cwd();
const boundary = [
  'packages/core/src/types/upstream/astSemanticStageTransition.ts',
  'packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts',
  'packages/core/src/compiler/analysis/ssa/renamer/blockInstructionRenamer.ts',
  'packages/core/src/compiler/utils/cfg/instructions.ts',
  'packages/core/src/compiler/scanner/resolvers/RouteCrudClassifier.ts',
];

const forbidden = (file) => {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const out = { if:0, while:0, for:0, switch:0, map:0, filter:0, reduce:0, flatMap:0, undefined:0, nullish:0, strictEquality:0, strictInequality:0, unknownCast:0, extractCast:0, anyKeyword:0, nullKeyword:0, setConstruction:0, mapConstruction:0, conditional:0, optional:0, extractType:0 };
  const visit = node => {
    if (node.kind === ts.SyntaxKind.IfStatement) out.if++;
    if (node.kind === ts.SyntaxKind.WhileStatement || node.kind === ts.SyntaxKind.DoStatement) out.while++;
    if (node.kind === ts.SyntaxKind.ForStatement || node.kind === ts.SyntaxKind.ForInStatement || node.kind === ts.SyntaxKind.ForOfStatement) out.for++;
    if (node.kind === ts.SyntaxKind.SwitchStatement) out.switch++;
    if (node.kind === ts.SyntaxKind.ConditionalExpression) out.conditional++;
    if (node.kind === ts.SyntaxKind.QuestionDotToken || node.kind === ts.SyntaxKind.QuestionToken) out.optional++;
    if (node.kind === ts.SyntaxKind.Identifier && node.text === 'undefined') out.undefined++;
    if (node.kind === ts.SyntaxKind.BinaryExpression) {
      const op = node.operatorToken.kind;
      if (op === ts.SyntaxKind.QuestionQuestionToken) out.nullish++;
      if (op === ts.SyntaxKind.EqualsEqualsEqualsToken) out.strictEquality++;
      if (op === ts.SyntaxKind.ExclamationEqualsEqualsToken) out.strictInequality++;
    }
    if (node.kind === ts.SyntaxKind.CallExpression) {
      const expression = node.expression;
      if (ts.isPropertyAccessExpression(expression)) {
        const n = expression.name.text;
        if (n === 'map') out.map++;
        if (n === 'filter') out.filter++;
        if (n === 'reduce') out.reduce++;
        if (n === 'flatMap') out.flatMap++;
      }
    }
    if (node.kind === ts.SyntaxKind.AsExpression) {
      const text = node.type.getText(sf);
      if (text === 'unknown') out.unknownCast++;
      if (text.startsWith('Extract<')) out.extractCast++;
    }
    if (node.kind === ts.SyntaxKind.TypeReference && node.typeName.getText(sf) === 'Extract') out.extractType++;
    if (node.kind === ts.SyntaxKind.AnyKeyword) out.anyKeyword++;
    if (node.kind === ts.SyntaxKind.NullKeyword) out.nullKeyword++;
    if (node.kind === ts.SyntaxKind.NewExpression) {
      const n = node.expression.getText(sf);
      if (n === 'Set') out.setConstruction++;
      if (n === 'Map') out.mapConstruction++;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
};

const reports = Object.fromEntries(boundary.map(file => [file, forbidden(file)]));
const transition = reports[boundary[0]];
const pipelineText = fs.readFileSync(path.join(ROOT, boundary[1]), 'utf8');
const transitionText = fs.readFileSync(path.join(ROOT, boundary[0]), 'utf8');
const cfgText = fs.readFileSync(path.join(ROOT, 'packages/core/src/compiler/utils/cfg/instructions.ts'), 'utf8');
const solverEmpty = fs.statSync(path.join(ROOT, 'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts')).size === 0;
const syntaxEmpty = fs.statSync(path.join(ROOT, 'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts')).size === 0;
const transitionKinds = [
  'scanner_to_mapping_transition',
  'mapping_to_resolver_transition',
  'resolver_to_analysis_transition',
  'analysis_to_lowering_transition',
  'lowering_to_target_transition',
].every(kind => transitionText.includes(kind));
const transitionsCarried = pipelineText.includes('readonly transitions: readonly AstSemanticStageTransition[]') && pipelineText.includes('pipelineTransitions(');
const closedReturn = cfgText.includes("export type ReturnValue") && cfgText.includes("kind: 'return_value'") && cfgText.includes("kind: 'return_void'") && !/value\?:\s*Operand/.test(cfgText);
const clean = Object.values(reports).every(report => Object.values(report).every(value => value === 0));
const result = {
  phase: 673,
  model: 'highest AST semantic transition algebra + closed analysis return ADT',
  transitionAlgebra: transitionKinds,
  transitionsCarriedByAuthority: transitionsCarried,
  closedReturnADT: closedReturn,
  legacySolverEmpty: solverEmpty,
  syntaxCoreEmpty: syntaxEmpty,
  boundary: reports,
  cleanBoundary: clean,
  success: transitionKinds && transitionsCarried && closedReturn && solverEmpty && syntaxEmpty && clean,
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.success ? 0 : 1;
