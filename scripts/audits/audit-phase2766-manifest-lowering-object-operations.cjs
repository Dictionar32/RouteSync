const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const targets = [
  'packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts',
  'packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts',
  'packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts',
];
const parsed = new Map();
const syntaxErrors = [];
for (const relative of targets) {
  const file = path.join(root, relative);
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  parsed.set(relative, source);
  for (const diagnostic of source.parseDiagnostics) syntaxErrors.push({ relative, diagnostic });
}
function declarations(relative) {
  const result = new Map();
  function visit(node) {
    if (ts.isInterfaceDeclaration(node)) result.set(`interface:${node.name.text}`, node);
    if (ts.isVariableStatement(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) result.set(`value:${declaration.name.text}`, declaration);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed.get(relative));
  return result;
}
const lowererPath = targets[0];
const items = declarations(lowererPath);
const source = parsed.get(lowererPath);
function objectOperation(name, interfaceName, tag, methodNames) {
  const declaration = items.get(`value:${name}`);
  if (!declaration || declaration.type?.getText(source) !== interfaceName) return false;
  const initializer = declaration.initializer;
  if (!initializer || !ts.isCallExpression(initializer) || initializer.expression.getText(source) !== 'Object.freeze' || !ts.isObjectLiteralExpression(initializer.arguments[0])) return false;
  const object = initializer.arguments[0];
  const prop = key => object.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(source) === key);
  const kind = prop('kind');
  if (!kind || !ts.isStringLiteral(kind.initializer) || kind.initializer.text !== tag) return false;
  return methodNames.every(name => {
    const method = prop(name);
    return !!method && ts.isArrowFunction(method.initializer) && method.initializer.parameters.every(p => !!p.type) && !!method.initializer.type;
  });
}
const text = fs.readFileSync(path.join(root, lowererPath), 'utf8');
const builderText = fs.readFileSync(path.join(root, targets[1]), 'utf8');
const scannerText = fs.readFileSync(path.join(root, targets[2]), 'utf8');
const checks = [
  ['Selected manifest-lowering/runtime files have no TypeScript syntax diagnostics', syntaxErrors.length === 0],
  ['Manifest lowering no longer imports or traverses Sequence', !/\bSequence\b|sequenceToArray/.test(text)],
  ['Discovery ADT is consumed as direct readonly-array data', /discoveredItems = <T>/.test(text) && /discovery\.result\.items/.test(text) && !/discoveredMany/.test(text)],
  ['Manifest AST projection is an explicit frozen operation with typed route/model/resource/channel methods', objectOperation('routeManifestAstProjectionOperations', 'RouteManifestAstProjectionOperationsInterface', 'route_manifest_ast_projection_operations', ['routeFlows', 'models', 'resources', 'channels'])],
  ['Lowering calls the named AST projection operations instead of primitive helper functions', /routeManifestAstProjectionOperations\.routeFlows\(manifest\)/.test(text) && /routeManifestAstProjectionOperations\.models\(manifest\)/.test(text) && /routeManifestAstProjectionOperations\.resources\(manifest\)/.test(text) && /routeManifestAstProjectionOperations\.channels\(manifest\)/.test(text)],
  ['Legacy projection names and Sequence conversion helpers are absent', !/\b(routeFlowsFromManifest|modelAsts|resourceAsts|channelDescriptorsFromManifest|sequenceToArray|discoveredMany)\b/.test(text)],
  ['Upstream builder retains explicit AST and source-model blocker ADT branches', /manifest_builder_source_ast_blocked/.test(builderText) && /manifest_builder_source_model_blocked/.test(builderText)],
  ['Upstream scanner calls typed preparation and scan operation objects', /manifestBuilderOperationPreparation/.test(scannerText) && /routeSyncManifestScanOperationFactory/.test(scannerText)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
console.log(`Target files: ${targets.length}`);
console.log(`Syntax diagnostics: ${syntaxErrors.length}`);
console.log(`Phase 2766 manifest-lowering object operations: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
if (syntaxErrors.length) for (const item of syntaxErrors) console.log(`SYNTAX ${item.relative}: ${item.diagnostic.messageText}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
