const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const scanRoots = [
  'packages/cli/src/commands',
  'packages/core/src/compiler/scanner/orchestrator',
  'packages/core/src/compiler/scanner/wiring',
  'packages/core/src/compiler/scanner/upstream/route',
];
const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
  const relative = path.posix.join(dir, entry.name);
  if (entry.isDirectory()) return walk(relative);
  return entry.isFile() && relative.endsWith('.ts') && !relative.endsWith('.test.ts') ? [relative] : [];
});
const files = [...new Set(scanRoots.flatMap(walk))].sort();
const findings = [];
let syntaxDiagnostics = 0;
for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  syntaxDiagnostics += ast.parseDiagnostics.length;
  for (const node of ast.statements) {
    const exported = !!node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;
    if (ts.isFunctionDeclaration(node) && node.name) {
      findings.push({ file, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, kind: 'export_function', name: node.name.text });
    }
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
        const initializer = declaration.initializer;
        if (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) {
          findings.push({
            file,
            line: ast.getLineAndCharacterOfPosition(declaration.getStart(ast)).line + 1,
            kind: declaration.type ? 'export_function_value_typed' : 'export_function_value_untyped',
            name: declaration.name.text,
          });
        }
      }
    }
  }
}
const criticalFiles = [
  'packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts',
  'packages/core/src/compiler/scanner/wiring/semanticDataflowInputAdapter.ts',
  'packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts',
  'packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts',
  'packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts',
  'packages/core/src/compiler/scanner/wiring/integratedRouteManifestAuthority.ts',
];
const criticalFindings = findings.filter(item => criticalFiles.includes(item.file));
const adapter = fs.readFileSync(path.join(root, criticalFiles[1]), 'utf8');
const manifestTypes = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/manifestBuilderInterface.ts'), 'utf8');
const checks = {
  allSelectedTypeScriptFilesParse: syntaxDiagnostics === 0,
  manifestSpineHasNoExportedFunctionDeclarationsOrArrowExports: criticalFindings.length === 0,
  dataflowAdapterUsesExplicitOperationsInterface: /export const semanticDataflowInputAdapterOperations:\s*SemanticDataflowInputAdapterOperationsInterface\s*=\s*Object\.freeze/.test(adapter),
  dataflowRuntimeRequestIsOperationMethod: /runtimeRequestFromKnowledge:\s*\(knowledge: SemanticKnowledgeDataFlow\)/.test(adapter),
  manifestOutcomeIsClosedADT: /type ManifestBuilderJudgment\s*=\s*ManifestBuilderCompleteJudgment\s*\|\s*ManifestBuilderBlockedJudgment/.test(manifestTypes),
  ASTAndSourceModelFailuresHaveDistinctDiscriminators: /kind: 'manifest_builder_source_ast_blocked'/.test(manifestTypes) && /kind: 'manifest_builder_source_model_blocked'/.test(manifestTypes),
};
for (const [name, passed] of Object.entries(checks)) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`AST scope: ${files.length} TypeScript files; syntax diagnostics: ${syntaxDiagnostics}`);
console.log(`Remaining exported function-shaped declarations in selected runtime scan roots: ${findings.length}`);
for (const finding of findings.slice(0, 80)) console.log(`REMAIN ${finding.file}:${finding.line} ${finding.kind} ${finding.name}`);
if (findings.length > 80) console.log(`... ${findings.length - 80} additional findings omitted`);
console.log(`Critical manifest spine violations: ${criticalFindings.length}`);
console.log(`Phase 2754 AST runtime export audit: ${Object.values(checks).filter(Boolean).length}/${Object.keys(checks).length} structural checks passed`);
console.log('This audit is syntax/structure based. It does not substitute for semantic typecheck, unit tests, package build, or CLI E2E.');
if (Object.values(checks).some(passed => !passed)) process.exit(1);
