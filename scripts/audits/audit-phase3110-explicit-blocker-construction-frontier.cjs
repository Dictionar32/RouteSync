#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const upstreamPath = 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts';
const testPath = 'packages/core/src/types/upstream/__tests__/laravel-controller-source-discovery-blocker.phase2915.test.ts';
const upstream = read(upstreamPath);
const cli = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const tests = read(testPath);
const sourceRoots = ['packages/core/src', 'packages/cli/src', 'packages/sdk/src', 'packages/react/src'];
const files = [];
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) files.push(full);
  }
};
for (const relative of sourceRoots) walk(path.join(root, relative));
let exportedFunctions = 0;
let exportedArrowFunctions = 0;
let genericContinueWith = 0;
for (const file of files) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = node => {
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) exportedFunctions += 1;
    if (ts.isVariableStatement(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const declaration of node.declarationList.declarations) {
        if (declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) exportedArrowFunctions += 1;
      }
    }
    if (ts.isArrowFunction(node) && node.typeParameters?.some(parameter => parameter.name.text === 'Result') && node.parent && ts.isPropertyAssignment(node.parent) && node.parent.name.getText(source) === 'continueWith') genericContinueWith += 1;
    ts.forEachChild(node, visit);
  };
  visit(source);
}
const checks = {
  phase: 3110,
  scope: 'remove mutable blocker staging in upstream discovery ADT and refresh AST migration frontier',
  blockerFactoriesUseTypedConstConstruction: !/\blet blocker:/.test(upstream) && (upstream.match(/const blocker: Extract<LaravelControllerSourceDiscoveryBlocker/g) || []).length === 6,
  allBlockerVariantsRetainDomainSettlement: ['rootMissing', 'directoryMissing', 'pathNotDirectory', 'directoryUnreadable', 'symbolicLinkEncountered', 'failureCodeUnrecognized'].every(name => upstream.includes(`${name}:`)) && /readonly blockDiscovery:/.test(upstream),
  runtimeFailureSettlementStillUsesUpstreamOperation: /laravelControllerSourceDiscoveryJudgmentFactory\.blockedByFilesystemFailure\(/.test(cli) && /\.blockDiscovery\(Object\.freeze\(/.test(upstream),
  regressionCoversAllBlockerVariantsAndImmutableOperations: ['rootMissing', 'directoryMissing', 'pathNotDirectory', 'directoryUnreadable', 'symbolicLinkEncountered', 'failureCodeUnrecognized'].every(name => tests.includes(`laravelControllerSourceDiscoveryBlockerFactory.${name}`)) && /Object\.isFrozen/.test(tests) && /blocker\.blockDiscovery\(settlement\)/.test(tests),
  noDeletedRelationFoundationRestored: !/semantic\/relations\/(relationMembership|relationalSequence|semanticRelations)/.test(upstream + cli),
  astInventory: { typescriptFiles: files.length, exportedFunctionDeclarations: exportedFunctions, exportedArrowOrFunctionExpressionVariables: exportedArrowFunctions, genericContinueWithArrowImplementations: genericContinueWith },
  globalExportMigrationComplete: false,
  globalPrimitiveAndControlFlowErasureComplete: false,
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
const failed = Object.entries(checks).filter(([key, value]) => !['phase', 'scope', 'astInventory', 'globalExportMigrationComplete', 'globalPrimitiveAndControlFlowErasureComplete', 'fullTypecheckVerified', 'fullTestSuiteVerified', 'phpToCliManifestGeneratorE2eVerified'].includes(key) && value === false).map(([key]) => key);
const reportPath = path.join(root, 'reports/PHASE3110_EXPLICIT_BLOCKER_CONSTRUCTION_FRONTIER_AUDIT.json');
fs.writeFileSync(reportPath, JSON.stringify(checks, null, 2) + '\n');
console.log(JSON.stringify(checks, null, 2));
if (failed.length) process.exitCode = 1;
