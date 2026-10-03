const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');

const files = [
  'packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts',
  'packages/core/src/compiler/analysis/astAnalysisInterface.ts',
  'packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts',
  'packages/core/src/compiler/scanner/subscanners/expressionAstCanonical.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticEvidenceRelationCompiler.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/routeSyntaxSemanticInterface.ts',
];

const scan = (relative) => {
  const file = path.join(root, relative);
  const source = fs.readFileSync(file, 'utf8');
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const counts = {
    if: 0, while: 0, for: 0, switch: 0, map: 0, filter: 0, reduce: 0, flatMap: 0,
    undefined: 0, nullish: 0, strictEquality: 0, strictInequality: 0,
    unknownCast: 0, extractCast: 0, anyKeyword: 0, nullKeyword: 0, setConstruction: 0, mapConstruction: 0,
  };
  const visit = node => {
    if (node.kind === ts.SyntaxKind.IfStatement) counts.if++;
    if (node.kind === ts.SyntaxKind.WhileStatement || node.kind === ts.SyntaxKind.DoStatement) counts.while++;
    if (node.kind === ts.SyntaxKind.ForStatement || node.kind === ts.SyntaxKind.ForOfStatement || node.kind === ts.SyntaxKind.ForInStatement) counts.for++;
    if (node.kind === ts.SyntaxKind.SwitchStatement) counts.switch++;
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const name = node.expression.name.text;
      if (name === 'map') counts.map++;
      if (name === 'filter') counts.filter++;
      if (name === 'reduce') counts.reduce++;
      if (name === 'flatMap') counts.flatMap++;
    }
    if (ts.isIdentifier(node) && node.text === 'undefined') counts.undefined++;
    if (ts.isBinaryExpression(node)) {
      if (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) counts.nullish++;
      if (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) counts.strictEquality++;
      if (node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) counts.strictInequality++;
    }
    if (ts.isAsExpression(node)) {
      const t = node.type.getText(tree);
      if (t === 'unknown') counts.unknownCast++;
      if (/^Extract\s*</.test(t)) counts.extractCast++;
    }
    if (node.kind === ts.SyntaxKind.AnyKeyword) counts.anyKeyword++;
    if (node.kind === ts.SyntaxKind.NullKeyword) counts.nullKeyword++;
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression)) {
      if (node.expression.text === 'Set') counts.setConstruction++;
      if (node.expression.text === 'Map') counts.mapConstruction++;
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return counts;
};

const report = Object.fromEntries(files.map(file => [file, scan(file)]));
const failures = Object.entries(report).flatMap(([file, counts]) => Object.entries(counts)
  .filter(([, value]) => value !== 0)
  .map(([name, value]) => ({ file, name, value })));

const inactive = JSON.parse(execFileSync(process.execPath, [path.join(root, 'scripts/audit-phase525-inactive-file-vacuum.cjs')], { encoding: 'utf8' }));
const legacy = [
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
].every(file => fs.statSync(path.join(root, file)).size === 0);

const result = {
  phase: 672,
  model: 'highest AST semantic authority closure: cross-stage authority pipeline + proof-free scanner/refinement frontier + fixed-point analysis interface',
  authorityPipeline: fs.existsSync(path.join(root, 'packages/core/src/types/upstream/astSemanticAuthorityPipeline.ts')),
  analysisInterface: fs.existsSync(path.join(root, 'packages/core/src/compiler/analysis/astAnalysisInterface.ts')),
  legacySolverEmpty: legacy,
  inactiveVacuum: inactive.allCandidatesEmpty === true,
  boundary: report,
  residualBoundaryConstructs: failures,
  success: failures.length === 0 && legacy && inactive.allCandidatesEmpty === true,
};
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.success ? 0 : 1;
