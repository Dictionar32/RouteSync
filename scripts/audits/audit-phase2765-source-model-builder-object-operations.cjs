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
const exportedFunctionDeclarations = [];
const exportedValues = new Map();
const interfaces = new Map();
const sourceTexts = new Map();
for (const relative of targets) {
  const file = path.join(root, relative);
  const text = fs.readFileSync(file, 'utf8');
  sourceTexts.set(relative, text);
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const diagnostic of source.parseDiagnostics) parseDiagnostics.push({ relative, diagnostic });
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      exportedFunctionDeclarations.push({ relative, name: node.name.text, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1 });
    }
    if (ts.isInterfaceDeclaration(node)) interfaces.set(`${relative}::${node.name.text}`, node);
    if (ts.isVariableStatement(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) exportedValues.set(`${relative}::${declaration.name.text}`, { declaration, source, text });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
function objectOperation(relative, name, typeName, kind, method, paramTypes, outputType) {
  const found = exportedValues.get(`${relative}::${name}`);
  if (!found) return false;
  const { declaration, source } = found;
  if (declaration.type?.getText(source) !== typeName) return false;
  const init = declaration.initializer;
  if (!init || !ts.isCallExpression(init) || init.expression.getText(source) !== 'Object.freeze' || init.arguments.length !== 1 || !ts.isObjectLiteralExpression(init.arguments[0])) return false;
  const object = init.arguments[0];
  const prop = key => object.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(source) === key);
  const tag = prop('kind');
  const methodProp = prop(method);
  if (!tag || !ts.isStringLiteral(tag.initializer) || tag.initializer.text !== kind || !methodProp || !ts.isArrowFunction(methodProp.initializer)) return false;
  const fn = methodProp.initializer;
  if (fn.parameters.length !== paramTypes.length || fn.parameters.some((p, i) => p.type?.getText(source) !== paramTypes[i]) || fn.type?.getText(source) !== outputType) return false;
  const iface = interfaces.get(`${relative}::${typeName}`);
  const member = iface?.members.find(m => (ts.isMethodSignature(m) || ts.isPropertySignature(m)) && m.name.getText(source) === method);
  if (!member) return false;
  if (ts.isMethodSignature(member)) {
    return member.parameters.length === paramTypes.length && member.parameters.every((p, i) => p.type?.getText(source) === paramTypes[i]) && member.type?.getText(source) === outputType;
  }
  const functionType = member.type;
  return !!functionType && ts.isFunctionTypeNode(functionType) && functionType.parameters.length === paramTypes.length && functionType.parameters.every((p, i) => p.type?.getText(source) === paramTypes[i]) && functionType.type?.getText(source) === outputType;
}
const modelFile = 'packages/core/src/types/upstream/highLevelSourceModel.ts';
const modelText = sourceTexts.get(modelFile);
const builderText = sourceTexts.get('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const checks = [
  ['All selected upstream manifest trace files parse without TypeScript syntax diagnostics', parseDiagnostics.length === 0],
  ['No exported function declarations remain in the selected CLI/scanner/source-model path', exportedFunctionDeclarations.length === 0],
  ['AST-to-model projection is an interface-typed frozen object with explicit ADT tag and project signature', objectOperation(modelFile, 'modelSemanticNodeFromAst', 'ModelSemanticNodeFromAstOperation', 'model_semantic_node_from_ast_operation', 'project', ['ModelAst'], 'ModelSemanticNode')],
  ['Source-catalog projection is an interface-typed frozen object with explicit ADT tag and project signature', objectOperation(modelFile, 'semanticContractCatalogFromSourceCatalog', 'SemanticContractCatalogFromSourceCatalogOperation', 'semantic_contract_catalog_from_source_catalog_operation', 'project', ['SourceModelCatalog'], 'LaravelSemanticContractCatalog')],
  ['Source-model reference-index operation is an interface-typed frozen object with explicit build method', objectOperation(modelFile, 'sourceModelReferenceIndexFromCatalog', 'SourceModelReferenceIndexBuilderInterface', 'source_model_reference_index_builder', 'build', ['SourceModelCatalog', 'readonly EffectiveControllerActionPolicy[]'], 'SourceModelReferenceIndex')],
  ['Complete source-model operation is an interface-typed frozen object with explicit build method', objectOperation(modelFile, 'buildCompleteLaravelSourceModel', 'CompleteLaravelSourceModelBuilderInterface', 'complete_laravel_source_model_builder', 'build', ['CompleteLaravelSourceModelBuildInput'], 'CompleteSourceModelBuildResult')],
  ['Canonical reference-index alias points to the same operation object', /sourceModelReferenceIndexBuilder:\s*SourceModelReferenceIndexBuilderInterface\s*=\s*sourceModelReferenceIndexFromCatalog/.test(modelText)],
  ['Canonical complete-source-model alias points to the same operation object', /completeLaravelSourceModelBuilder:\s*CompleteLaravelSourceModelBuilderInterface\s*=\s*buildCompleteLaravelSourceModel/.test(modelText)],
  ['Manifest builder injects the object operation and invokes its typed build method', /const sourceModelBuilder = completeLaravelSourceModelBuilder satisfies CompleteLaravelSourceModelBuilderInterface/.test(builderText) && /sourceModelBuilder\.build\(Object\.freeze\(\{/.test(builderText)],
  ['AST and source-model blockers remain separate explicit ADT variants', /manifest_builder_source_ast_blocked/.test(builderText) && /manifest_builder_source_model_blocked/.test(builderText)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`Target files: ${targets.length}`);
console.log(`Exported function declarations remaining: ${exportedFunctionDeclarations.length}`);
console.log(`Phase 2765 source-model builder object operations: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
if (exportedFunctionDeclarations.length) for (const item of exportedFunctionDeclarations) console.log(`REMAIN ${item.relative}:${item.line} ${item.name}`);
if (parseDiagnostics.length) for (const item of parseDiagnostics) console.log(`SYNTAX ${item.relative}: ${item.diagnostic.messageText}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
