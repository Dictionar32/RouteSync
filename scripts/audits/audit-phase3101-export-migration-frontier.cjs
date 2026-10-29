const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const scopes = ['packages/core/src', 'packages/cli/src', 'packages/sdk/src', 'packages/react/src'];
const files = [];
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile() && file.endsWith('.ts')) files.push(file);
  }
};
scopes.forEach(scope => walk(path.join(root, scope)));

let exportFunctionDeclarations = 0;
let exportedArrowVariableDeclarations = 0;
let exportedFunctionExpressionVariableDeclarations = 0;
let genericContinueWithArrowImplementations = 0;
const sampleExportFunctions = [];
const sampleExportArrows = [];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const relativeFile = path.relative(root, file);
  const visit = node => {
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      exportFunctionDeclarations += 1;
      if (sampleExportFunctions.length < 12) {
        sampleExportFunctions.push({ file: relativeFile, name: node.name?.text || '<anonymous>', line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1 });
      }
    }
    if (ts.isVariableStatement(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const declaration of node.declarationList.declarations) {
        if (declaration.initializer && ts.isArrowFunction(declaration.initializer)) {
          exportedArrowVariableDeclarations += 1;
          if (sampleExportArrows.length < 12) {
            sampleExportArrows.push({ file: relativeFile, name: declaration.name.getText(sourceFile), line: sourceFile.getLineAndCharacterOfPosition(declaration.getStart(sourceFile)).line + 1 });
          }
        } else if (declaration.initializer && ts.isFunctionExpression(declaration.initializer)) {
          exportedFunctionExpressionVariableDeclarations += 1;
        }
      }
    }
    if (ts.isPropertyAssignment(node) && node.name.getText(sourceFile) === 'continueWith' && node.initializer && ts.isArrowFunction(node.initializer) && node.initializer.typeParameters?.some(parameter => parameter.name.text === 'Result')) {
      genericContinueWithArrowImplementations += 1;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

const report = {
  phase: 3101,
  method: 'TypeScript compiler AST scan',
  scope: scopes,
  typescriptFiles: files.length,
  exportFunctionDeclarations,
  exportedArrowVariableDeclarations,
  exportedFunctionExpressionVariableDeclarations,
  totalNamedExportFunctionCandidates: exportFunctionDeclarations + exportedArrowVariableDeclarations + exportedFunctionExpressionVariableDeclarations,
  remainingGenericContinueWithArrowImplementations: genericContinueWithArrowImplementations,
  sampleExportFunctions,
  sampleExportArrows,
  conversionComplete: false,
};
const output = path.join(root, 'reports/PHASE3101_REPOSITORY_EXPORT_MIGRATION_FRONTIER.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ phase: report.phase, method: report.method, typescriptFiles: report.typescriptFiles, exportFunctionDeclarations: report.exportFunctionDeclarations, exportedArrowVariableDeclarations: report.exportedArrowVariableDeclarations, exportedFunctionExpressionVariableDeclarations: report.exportedFunctionExpressionVariableDeclarations, totalNamedExportFunctionCandidates: report.totalNamedExportFunctionCandidates, remainingGenericContinueWithArrowImplementations: report.remainingGenericContinueWithArrowImplementations }, null, 2));
