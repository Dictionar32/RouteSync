const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const scopes = ['packages/core/src', 'packages/cli/src', 'packages/sdk/src', 'packages/react/src'];
const files = [];
const walk = directory => {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(target);
    else if (/\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) files.push(target);
  }
};
scopes.forEach(scope => walk(path.join(root, scope)));
const counts = {
  typescriptFiles: files.length,
  exportedFunctionDeclarations: 0,
  exportedArrowVariableDeclarations: 0,
  exportedFunctionExpressionVariableDeclarations: 0,
  genericContinueWithArrowImplementations: 0,
  ifStatements: 0,
  switchStatements: 0,
  forStatements: 0,
  whileStatements: 0,
  conditionalExpressions: 0,
  nullishCoalescingExpressions: 0,
  strictEqualityExpressions: 0,
  mapPropertyCalls: 0,
  reducePropertyCalls: 0,
  lookupIdentifiers: 0,
  visitorIdentifiers: 0,
  voidKeywordTypes: 0,
  anyKeywordTypes: 0,
  unknownKeywordTypes: 0,
};
const exported = node => node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
for (const file of files) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = node => {
    if (ts.isFunctionDeclaration(node) && exported(node)) counts.exportedFunctionDeclarations++;
    if (ts.isVariableStatement(node) && exported(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isArrowFunction(declaration.initializer)) counts.exportedArrowVariableDeclarations++;
        if (ts.isFunctionExpression(declaration.initializer)) counts.exportedFunctionExpressionVariableDeclarations++;
      }
    }
    if (ts.isArrowFunction(node) && node.typeParameters?.some(parameter => parameter.name.text === 'Result') && node.parent && node.parent.getText(source).includes('continueWith')) counts.genericContinueWithArrowImplementations++;
    if (ts.isIfStatement(node)) counts.ifStatements++;
    if (ts.isSwitchStatement(node)) counts.switchStatements++;
    if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node)) counts.forStatements++;
    if (ts.isWhileStatement(node) || ts.isDoStatement(node)) counts.whileStatements++;
    if (ts.isConditionalExpression(node)) counts.conditionalExpressions++;
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) counts.nullishCoalescingExpressions++;
    if (ts.isBinaryExpression(node) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(node.operatorToken.kind)) counts.strictEqualityExpressions++;
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      if (node.expression.name.text === 'map') counts.mapPropertyCalls++;
      if (node.expression.name.text === 'reduce') counts.reducePropertyCalls++;
    }
    if (ts.isIdentifier(node) && node.text === 'lookup') counts.lookupIdentifiers++;
    if (ts.isIdentifier(node) && /visitor/i.test(node.text)) counts.visitorIdentifiers++;
    if (node.kind === ts.SyntaxKind.VoidKeyword) counts.voidKeywordTypes++;
    if (node.kind === ts.SyntaxKind.AnyKeyword) counts.anyKeywordTypes++;
    if (node.kind === ts.SyntaxKind.UnknownKeyword) counts.unknownKeywordTypes++;
    ts.forEachChild(node, visit);
  };
  visit(source);
}
const report = {
  phase: 3105,
  scope: scopes,
  auditMode: 'TypeScript compiler AST inventory; counts are structural findings, not an instruction to mechanically delete syntax',
  counts,
  crossLayerBoundary: {
    remainingDiscoveryContinuation: 'controllerInvocationManifestComposition.ts still maps upstream discovery outcomes to a CLI-owned terminal manifest; moving this projection into core would reverse the core-to-CLI dependency direction',
    nextMigrationRule: 'move the outcome knowledge into upstream/domain operations while keeping CLI manifest construction in CLI; preserve blocked evidence and source provenance',
  },
  noDeletedRelationFoundationRestored: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(root, 'packages/core/src/semantic/relations', name))),
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports/PHASE3105_UPSTREAM_DOMAIN_OPERATION_FRONTIER_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
