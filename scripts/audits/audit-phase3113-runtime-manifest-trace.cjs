#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const upstreamPath = 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts';
const cliPath = 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts';
const testPath = 'packages/core/src/types/upstream/__tests__/laravel-controller-source-discovery-complete-operation.phase3104.test.ts';
const upstream = read(upstreamPath);
const cli = read(cliPath);
const tests = read(testPath);
const contractStart = upstream.indexOf('export interface LaravelControllerSourceDiscoveryJudgmentOperations');
const contractEnd = upstream.indexOf('export type LaravelControllerSourceDiscoveryResult', contractStart);
const contract = upstream.slice(contractStart, contractEnd);
const roots = ['packages/core/src', 'packages/cli/src', 'packages/sdk/src', 'packages/react/src'];
const files = [];
const walk = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full); else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) files.push(full); } };
for (const dir of roots) if (fs.existsSync(path.join(root, dir))) walk(path.join(root, dir));
const counts = { typescriptFiles: files.length, exportedFunctionDeclarations: 0, exportedArrowOrFunctionExpressionVariables: 0, genericContinueWithArrowImplementations: 0, ifStatements: 0, switchStatements: 0, conditionalExpressions: 0, nullishCoalescingExpressions: 0 };
for (const file of files) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = node => {
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) counts.exportedFunctionDeclarations++;
    if (ts.isVariableStatement(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) for (const declaration of node.declarationList.declarations) if (declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) counts.exportedArrowOrFunctionExpressionVariables++;
    if (ts.isArrowFunction(node) && node.typeParameters?.some(p => p.name.text === 'Result') && node.parent && ts.isPropertyAssignment(node.parent) && node.parent.name.getText(source) === 'continueWith') counts.genericContinueWithArrowImplementations++;
    if (ts.isIfStatement(node)) counts.ifStatements++;
    if (ts.isSwitchStatement(node)) counts.switchStatements++;
    if (ts.isConditionalExpression(node)) counts.conditionalExpressions++;
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) counts.nullishCoalescingExpressions++;
    ts.forEachChild(node, visit);
  }; visit(source);
}
const checks = {
  phase: 3113,
  scope: 'verify the real Laravel controller discovery → upstream ADT → CLI manifest projection runtime boundary and record the remaining migration frontier',
  upstreamContractOwnsDomainOperations: ['projectForManifest', 'continueCompleteDiscovery', 'includeSource', 'block'].every(name => contract.includes(name)),
  completeProjectionPreservesSourceProjectRootAndSources: /laravel_controller_source_discovery_manifest_complete[\s\S]*?sourceProject: SourceProjectIdentity[\s\S]*?root: SourceFile[\s\S]*?sources: SourceFileInventory/.test(upstream),
  blockedProjectionPreservesPartialSourcesBlockerAndOriginalJudgment: /laravel_controller_source_discovery_manifest_blocked[\s\S]*?partialSources: SourceFileInventory[\s\S]*?blocker: LaravelControllerSourceDiscoveryBlocker[\s\S]*?preserveBlockedJudgment/.test(upstream),
  cliConsumesProjectionProducedByRuntimeDiscovery: /dependencies\.sourceDiscovery\.discover\(/.test(cli) && /discovery\.projectForManifest\(\)/.test(cli),
  blockedProjectionSettlesAsTerminalManifest: /manifestProjection\.preserveBlockedJudgment\(\)/.test(cli) && /sourceDiscoveryBlocked\(/.test(cli),
  completeProjectionContinuesIntoSourceReadAndManifestPipeline: /discoveredSourcesContinuationOperation\.continue\(Object\.freeze\(\{[\s\S]*?discoveredSources: manifestProjection\.sources/.test(cli),
  regressionCoversCompleteAndBlockedProjection: /projectForManifest/.test(tests) && /preserveBlockedJudgment/.test(tests) && /preserveCompleteJudgment/.test(tests),
  noDeletedRelationFoundationRestored: !/semantic\/relations\/(relationMembership|relationalSequence|semanticRelations)/.test(upstream + cli),
  astInventory: counts,
  globalExportInterfaceMigrationComplete: false,
  globalPrimitiveAndControlFlowErasureComplete: false,
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false
};
const requiredChecks = ['upstreamContractOwnsDomainOperations', 'completeProjectionPreservesSourceProjectRootAndSources', 'blockedProjectionPreservesPartialSourcesBlockerAndOriginalJudgment', 'cliConsumesProjectionProducedByRuntimeDiscovery', 'blockedProjectionSettlesAsTerminalManifest', 'completeProjectionContinuesIntoSourceReadAndManifestPipeline', 'regressionCoversCompleteAndBlockedProjection', 'noDeletedRelationFoundationRestored'];
const failed = requiredChecks.filter(key => checks[key] !== true);
const reportPath = path.join(root, 'reports/PHASE3113_RUNTIME_MANIFEST_TRACE_AUDIT.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(checks, null, 2)}\n`);
console.log(JSON.stringify({ report: path.relative(root, reportPath), checks, failed }, null, 2));
if (failed.length) process.exitCode = 1;
