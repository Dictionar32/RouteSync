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
const exportedFunctionShapes = [];
let syntaxDiagnostics = 0;
for (const file of files) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  syntaxDiagnostics += source.parseDiagnostics.length;
  for (const node of source.statements) {
    if (!node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    if (ts.isFunctionDeclaration(node) && node.name) {
      exportedFunctionShapes.push(`${file}:${source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1}:${node.name.text}`);
    }
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
        if (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer)) {
          exportedFunctionShapes.push(`${file}:${source.getLineAndCharacterOfPosition(declaration.getStart(source)).line + 1}:${declaration.name.text}`);
        }
      }
    }
  }
}
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const manifestTypes = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const checks = {
  selectedRuntimeSourcesParseWithoutSyntaxDiagnostics: syntaxDiagnostics === 0,
  selectedRuntimeRootsContainNoExportedFreeFunctionsOrFunctionValuedExports: exportedFunctionShapes.length === 0,
  routeMiddlewareResourceBoundaryUsesTypedOperationsObject: /export const routeResourceMiddlewareOperations:\s*RouteResourceMiddlewareOperationsInterface\s*=\s*Object\.freeze/.test(read('packages/core/src/compiler/scanner/upstream/route/resourceMiddlewareProjection.ts')),
  routeMiddlewareInputBoundaryUsesTypedOperationsObject: /export const routeMiddlewareSemanticInputOperations:\s*RouteMiddlewareSemanticInputOperationsInterface\s*=\s*Object\.freeze/.test(read('packages/core/src/compiler/scanner/upstream/route/routeMiddlewareSemanticInputBuilder.ts')),
  controllerActionPolicyRuntimeUsesTypedOperationsObject: /export const effectiveControllerActionPolicyOperations:\s*EffectiveControllerActionPolicyOperationsInterface\s*=\s*Object\.freeze/.test(read('packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts')),
  upstreamControllerPolicyAuthorityUsesTypedOperationsObject: /export const effectiveControllerActionPolicyUpstreamOperations:\s*EffectiveControllerActionPolicyUpstreamOperationsInterface\s*=\s*Object\.freeze/.test(read('packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts')),
  manifestLoweringUsesTypedOperationsObject: /export const routeSyncManifestLoweringOperations:\s*RouteSyncManifestLoweringOperationsInterface\s*=\s*Object\.freeze/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts')),
  dataflowProjectionUsesTypedOperationsObject: /export const routeSyncManifestDataflowProjection:\s*RouteSyncManifestDataflowProjectionInterface\s*=\s*Object\.freeze/.test(read('packages/core/src/compiler/analysis/routeSyncManifestDataflowProjection.ts')),
  dataflowAnalysisUsesTypedOperationsObject: /export const routeSyncManifestDataflowAnalysisOperations:\s*RouteSyncManifestDataflowAnalysisOperationsInterface\s*=\s*Object\.freeze/.test(read('packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts')),
  manifestOutcomeRemainsClosedADT: /type ManifestBuilderJudgment\s*=\s*ManifestBuilderCompleteJudgment\s*\|\s*ManifestBuilderBlockedJudgment/.test(manifestTypes),
  ASTAndSourceModelBlockersRemainDistinctADTArms: /kind: 'manifest_builder_source_ast_blocked'/.test(manifestTypes) && /kind: 'manifest_builder_source_model_blocked'/.test(manifestTypes),
  CLIManifestProjectionConsumesTypedLoweringOperation: /routeSyncManifestLoweringOperations\.lower\(/.test(read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionComposition.ts')),
};
for (const [name, passed] of Object.entries(checks)) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`AST runtime scope: ${files.length} TypeScript files; syntax diagnostics: ${syntaxDiagnostics}; exported function-shaped declarations: ${exportedFunctionShapes.length}`);
for (const finding of exportedFunctionShapes.slice(0, 40)) console.log(`REMAIN ${finding}`);
console.log(`Phase 2755 upstream ADT runtime operations audit: ${Object.values(checks).filter(Boolean).length}/${Object.keys(checks).length} checks passed`);
console.log('Static AST/source audit only; not a substitute for semantic typecheck, unit tests, build, or CLI E2E.');
if (Object.values(checks).some(passed => !passed)) process.exit(1);
