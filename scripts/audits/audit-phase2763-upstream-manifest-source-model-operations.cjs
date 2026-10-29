const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const targets = [
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  'packages/cli/src/manifestScanOperationInterface.ts',
  'packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts',
  'packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts',
  'packages/core/src/types/upstream/highLevelSourceModel.ts',
];
const parseDiagnostics = [];
const exportedFunctions = [];
const expectedOperationValues = new Map([
  ['packages/core/src/types/upstream/highLevelSourceModel.ts', [
    ['modelSemanticNodeFromAst', 'ModelSemanticNodeFromAstOperation'],
    ['semanticContractCatalogFromSourceCatalog', 'SemanticContractCatalogFromSourceCatalogOperation'],
  ]],
]);
const operationValues = new Map();
for (const relative of targets) {
  const file = path.join(root, relative);
  const text = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const diagnostic of source.parseDiagnostics) parseDiagnostics.push({ relative, diagnostic });
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      exportedFunctions.push({ relative, name: node.name.text, line: source.getLineAndCharacterOfPosition(node.getStart()).line + 1 });
    }
    if (ts.isVariableStatement(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.type && ts.isTypeReferenceNode(declaration.type)) {
          operationValues.set(`${relative}::${declaration.name.text}`, {
            name: declaration.name.text,
            type: declaration.type.typeName.getText(source),
            frozen: /Object\.freeze\(/.test(declaration.initializer?.getText(source) || ''),
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const required = [...expectedOperationValues.entries()].flatMap(([file, entries]) => entries.map(([name, type]) => ({ file, name, type })));
const missing = required.filter(item => {
  const actual = operationValues.get(`${item.file}::${item.name}`);
  return !actual || actual.type !== item.type || !actual.frozen;
});
const checks = [
  ['Manifest/source-model trace files parse without TypeScript syntax diagnostics', parseDiagnostics.length === 0],
  ['No exported function declarations remain in selected upstream manifest path', exportedFunctions.length === 0],
  ['Source-model AST projection is an explicit frozen interface-typed operation', !missing.some(item => item.name === 'modelSemanticNodeFromAst')],
  ['Source-model contract projection is an explicit frozen interface-typed operation', !missing.some(item => item.name === 'semanticContractCatalogFromSourceCatalog')],
  ['Required operation interfaces and explicit output signatures are present', required.length === 2 && missing.length === 0],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`Target runtime files: ${targets.length}`);
console.log(`Exported function declarations remaining: ${exportedFunctions.length}`);
console.log(`Required interface-typed operation values: ${required.length}`);
if (exportedFunctions.length) for (const item of exportedFunctions) console.log(`REMAIN ${item.relative}:${item.line} ${item.name}`);
if (missing.length) for (const item of missing) console.log(`MISSING_OR_INVALID ${item.file} ${item.name}:${item.type}`);
if (parseDiagnostics.length) for (const item of parseDiagnostics) console.log(`SYNTAX ${item.relative}: ${item.diagnostic.messageText}`);
console.log(`Phase 2763 upstream manifest source-model operations: ${checks.length - failed}/${checks.length}`);
if (failed) process.exitCode = 1;
