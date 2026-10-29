const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const target = 'packages/core/src/types/upstream/highLevelSourceModel.ts';
const sourceText = fs.readFileSync(path.join(root, target), 'utf8');
const source = ts.createSourceFile(target, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const parseDiagnostics = [...source.parseDiagnostics];
const exportedFunctions = [];
const operationSpecs = [
  { name: 'modelSemanticNodeFromAst', type: 'ModelSemanticNodeFromAstOperation', kind: 'model_semantic_node_from_ast_operation', method: 'project', input: 'ModelAst', output: 'ModelSemanticNode' },
  { name: 'semanticContractCatalogFromSourceCatalog', type: 'SemanticContractCatalogFromSourceCatalogOperation', kind: 'semantic_contract_catalog_from_source_catalog_operation', method: 'project', input: 'SourceModelCatalog', output: 'LaravelSemanticContractCatalog' },
];
const found = new Map();
const interfaces = new Map();
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
    exportedFunctions.push({ name: node.name.text, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1 });
  }
  if (ts.isInterfaceDeclaration(node)) interfaces.set(node.name.text, node);
  if (ts.isVariableStatement(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) {
        found.set(declaration.name.text, {
          type: declaration.type && ts.isTypeReferenceNode(declaration.type) ? declaration.type.typeName.getText(source) : null,
          frozen: !!declaration.initializer && ts.isCallExpression(declaration.initializer) && declaration.initializer.expression.getText(source) === 'Object.freeze',
          objectStyle: !!declaration.initializer && ts.isCallExpression(declaration.initializer) && declaration.initializer.arguments.length === 1 && ts.isObjectLiteralExpression(declaration.initializer.arguments[0]),
          properties: declaration.initializer && ts.isCallExpression(declaration.initializer) && declaration.initializer.arguments[0] && ts.isObjectLiteralExpression(declaration.initializer.arguments[0]) ? declaration.initializer.arguments[0].properties : [],
        });
      }
    }
  }
  ts.forEachChild(node, visit);
}
visit(source);
const invalid = [];
for (const spec of operationSpecs) {
  const value = found.get(spec.name);
  const iface = interfaces.get(spec.type);
  const method = iface?.members.find(member => ts.isMethodSignature(member) && member.name.getText(source) === spec.method);
  const hasKind = value?.properties.some(property => ts.isPropertyAssignment(property) && property.name.getText(source) === 'kind' && property.initializer?.kind === ts.SyntaxKind.StringLiteral && property.initializer.text === spec.kind);
  const hasMethod = value?.properties.some(property => ts.isPropertyAssignment(property) && property.name.getText(source) === spec.method && ts.isArrowFunction(property.initializer) && property.initializer.parameters.length === 1 && property.initializer.parameters[0].type?.getText(source) === spec.input && property.initializer.type?.getText(source) === spec.output);
  if (!value || value.type !== spec.type || !value.frozen || !value.objectStyle || !iface || !hasKind || !hasMethod || !method || method.parameters.length !== 1 || method.parameters[0].type?.getText(source) !== spec.input || method.type?.getText(source) !== spec.output) invalid.push(spec.name);
}
const checks = [
  ['Source-model runtime file has no TypeScript syntax diagnostics', parseDiagnostics.length === 0],
  ['No exported function declarations remain in source-model runtime file', exportedFunctions.length === 0],
  ['AST-to-model operation is a frozen interface-typed object with explicit project method', !invalid.includes('modelSemanticNodeFromAst')],
  ['Source-catalog projection is a frozen interface-typed object with explicit project method', !invalid.includes('semanticContractCatalogFromSourceCatalog')],
  ['Both operation interfaces expose explicit input and output types with ADT identity tags', operationSpecs.every(spec => !invalid.includes(spec.name))],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`Target files: 1`);
console.log(`Object-style runtime operations: ${operationSpecs.length}`);
console.log(`Exported function declarations remaining: ${exportedFunctions.length}`);
if (invalid.length) console.log(`INVALID ${invalid.join(', ')}`);
if (parseDiagnostics.length) for (const diagnostic of parseDiagnostics) console.log(`SYNTAX ${diagnostic.messageText}`);
console.log(`Phase 2764 object-style source-model operations: ${checks.length - failed}/${checks.length}`);
if (failed) process.exitCode = 1;
