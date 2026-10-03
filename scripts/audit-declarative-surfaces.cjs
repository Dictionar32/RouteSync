const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const roots = [
  'packages/core/src/compiler/constraints',
  'packages/core/src/compiler/passes/adapter',
  'packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts',
  'packages/core/src/compiler/scanner/lexer/astClassifier.ts',
  'packages/core/src/compiler/scanner/subscanners/queryProducer.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRelationSolver.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticRewriteEngine.ts',
  'packages/core/src/compiler/scanner/lexer/routeAst/semanticClosureEngine.ts',
  'packages/core/src/semantic/kernel',
  'packages/core/src/semantic/plugins/expression/ternaryHandler.ts',
  'packages/core/src/semantic/plugins/frameworkRuleSelection.ts',
  'packages/core/src/semantic/SemanticResolutionKernel.ts',
];

const files = [];
const visitPath = (target) => {
  const stat = fs.statSync(target);
  if (stat.isFile()) return files.push(target);
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    const child = path.join(target, entry.name);
    if (entry.isDirectory()) visitPath(child);
    else if (entry.name.endsWith('.ts')) files.push(child);
  }
};
roots.forEach(visitPath);

const forbidden = (file) => {
  const source = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const counts = { if: 0, for: 0, while: 0, switch: 0, map: 0, filter: 0, reduce: 0, flatMap: 0, nullish: 0, undefined: 0, nullLiteral: 0, strictEquality: 0, asAssertion: 0 };
  const walk = (node) => {
    if (ts.isIfStatement(node)) counts.if += 1;
    if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) counts.for += 1;
    if (ts.isWhileStatement(node) || ts.isDoStatement(node)) counts.while += 1;
    if (ts.isSwitchStatement(node)) counts.switch += 1;
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const name = node.expression.name.text;
      if (name === 'map' || name === 'filter' || name === 'reduce' || name === 'flatMap') counts[name] += 1;
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) counts.nullish += 1;
    if (ts.isBinaryExpression(node) && (node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken || node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken)) counts.strictEquality += 1;
    if (node.kind === ts.SyntaxKind.NullKeyword) counts.nullLiteral += 1;
    if (ts.isAsExpression(node)) counts.asAssertion += 1;
    if (ts.isIdentifier(node) && node.text === 'undefined') counts.undefined += 1;
    if (node.kind === ts.SyntaxKind.UndefinedKeyword) counts.undefined += 1;
    ts.forEachChild(node, walk);
  };
  walk(sf);
  return { file, parseErrors: sf.parseDiagnostics.length, counts };
};

const results = files.map(forbidden);
results.forEach((result) => console.log(JSON.stringify(result)));
const violations = results.filter((result) => result.parseErrors || Object.values(result.counts).some(Boolean));
process.exitCode = violations.length ? 1 : 0;
