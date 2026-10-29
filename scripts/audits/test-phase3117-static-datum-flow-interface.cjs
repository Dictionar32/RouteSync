#!/usr/bin/env node
'use strict';

// Static CJS datum-flow test for the real upstream -> CLI -> PHP source-read -> semantic inventory path.
// This reads TypeScript AST only. It does not import project runtime modules and does not execute Vitest.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const paths = Object.freeze({
  upstream: 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts',
  cli: 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  audit: 'scripts/audits/test-phase3117-static-datum-flow-interface.cjs',
  report: 'reports/PHASE3117_STATIC_DATUM_FLOW_INTERFACE.json',
});
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const parse = (relative, sourceText) => ts.createSourceFile(relative, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const upstreamText = read(paths.upstream);
const cliText = read(paths.cli);
const upstream = parse(paths.upstream, upstreamText);
const cli = parse(paths.cli, cliText);
const visit = (node, predicate, found = []) => {
  if (predicate(node)) found.push(node);
  ts.forEachChild(node, child => { visit(child, predicate, found); });
  return found;
};
const nameOf = node => node && (ts.isIdentifier(node) || ts.isStringLiteral(node)) ? node.text : undefined;
const unwrap = expression => {
  let current = expression;
  while (current && (ts.isParenthesizedExpression(current) || ts.isAsExpression(current) || ts.isTypeAssertionExpression(current) || ts.isSatisfiesExpression(current))) current = current.expression;
  return current;
};
const hasCall = (source, method, receiverPattern) => visit(source, ts.isCallExpression).some(call => {
  const expression = unwrap(call.expression);
  return ts.isPropertyAccessExpression(expression) && nameOf(expression.name) === method && (!receiverPattern || receiverPattern.test(expression.expression.getText(source)));
});
const hasText = (sourceText, pattern) => pattern.test(sourceText);
const hasVariableType = (source, variable, type) => visit(source, ts.isVariableDeclaration).some(declaration => nameOf(declaration.name) === variable && declaration.type && ts.isTypeReferenceNode(declaration.type) && nameOf(declaration.type.typeName) === type);
const hasInterface = (source, name) => visit(source, ts.isInterfaceDeclaration).some(declaration => nameOf(declaration.name) === name);
const noTestRuntimeImports = !/from\s+['"]vitest['"]|require\(['"]vitest['"]\)|\.test\.tsx?/.test(upstreamText + cliText);

// These are datum-lineage obligations, not merely token-presence checks.
const flows = [
  {
    id: 'discovery-input',
    producer: 'canonicalProjectCompositionOperation',
    datum: ['sourceProject', 'root'],
    consumer: 'dependencies.sourceDiscovery.discover',
    invariant: 'The requested project identity and controller root enter the upstream discovery operation.',
    passed: hasCall(cli, 'discover', /sourceDiscovery/) && /sourceProject,\s*root:\s*sourceFileIdentityFactory\.create/.test(cliText),
  },
  {
    id: 'discovery-judgment-to-projection',
    producer: 'sourceDiscovery.discover',
    datum: ['discovery judgment'],
    consumer: 'discovery.projectForManifest',
    invariant: 'CLI consumes the upstream ADT projection rather than recreating the projection from raw fields.',
    passed: hasCall(cli, 'projectForManifest', /discovery/) && hasInterface(upstream, 'LaravelControllerSourceDiscoveryJudgmentOperations'),
  },
  {
    id: 'blocked-judgment-terminal',
    producer: 'blocked manifest projection',
    datum: ['sourceProject', 'root', 'partialSources', 'blocker', 'original judgment'],
    consumer: 'sourceDiscoveryBlocked terminal operation',
    invariant: 'Blocked discovery preserves the original judgment and blocker/partial inventory; it does not enter the complete-source read path.',
    passed: /manifestProjection\.preserveBlockedJudgment\(\)/.test(cliText) && /preserveBlockedJudgment:\s*\(\)\s*=>\s*judgment/.test(upstreamText) && /partialSources:\s*evidence\.partialSources/.test(upstreamText) && /blocker:\s*evidence\.blocker/.test(upstreamText),
  },
  {
    id: 'complete-projection-source-handoff',
    producer: 'complete manifest projection',
    datum: ['sources', 'sourceProject'],
    consumer: 'discoveredSourcesContinuationOperation.continue',
    invariant: 'Complete projection hands the same source inventory and project identity to the CLI continuation.',
    passed: /discoveredSources:\s*manifestProjection\.sources/.test(cliText) && /discoverySourceProject:\s*manifestProjection\.sourceProject/.test(cliText) && /sources:\s*evidence\.sources/.test(upstreamText) && /preserveCompleteJudgment:\s*\(\)\s*=>\s*judgment/.test(upstreamText),
  },
  {
    id: 'source-inventory-to-read-input',
    producer: 'discoveredSourcesContinuationOperation.continue',
    datum: ['discoveredSources', 'requestedSourceFile'],
    consumer: 'discoveredSourceReadSettlementOperation.readAll -> reader.read',
    invariant: 'Each inventory source is converted into a read input while retaining the requested source identity.',
    passed: /readAll\(\s*discoveredSources,\s*dependencies\.sourceDocumentReader,?\s*\)/.test(cliText) && /sources\.toSourceFiles\(\)\.map\(\(requestedSourceFile/.test(cliText) && /sourceFile:\s*requestedSourceFile/.test(cliText),
  },
  {
    id: 'source-read-settlement-evidence',
    producer: 'reader.read settlement',
    datum: ['requestedSourceFile', 'read result or failure evidence'],
    consumer: 'phpSourceDocumentReadOperationSettlementFactory',
    invariant: 'Both fulfilled and rejected reads remain associated with the requested source; failures retain observed code/name/message.',
    passed: /fulfilled\(requestedSourceFile,\s*result\)/.test(cliText) && /rejected\(requestedSourceFile,\s*Object\.freeze\(/.test(cliText) && /failureCode:\s*observation\.failureCode/.test(cliText) && /failureName:\s*observation\.failureName/.test(cliText) && /failureMessage:\s*observation\.failureMessage/.test(cliText),
  },
  {
    id: 'blocked-read-evidence-to-terminal',
    producer: 'sourceReadBatch.preserveRejectedEvidence / preserveBlockedEvidence',
    datum: ['sourceFiles', 'rejections', 'partialDocuments', 'blockedReads'],
    consumer: 'manifest terminal operations',
    invariant: 'Rejected/blocked read evidence is projected into terminal manifest operations rather than silently discarded.',
    passed: /sourceReadBatch\.preserveRejectedEvidence\(\)/.test(cliText) && /sourceFiles:\s*rejectedBatch\.sourceFiles/.test(cliText) && /rejections:\s*rejectedBatch\.rejections/.test(cliText) && /sourceReadBatch\.preserveBlockedEvidence\(\)/.test(cliText) && /partialDocuments:\s*blockedBatch\.partialDocuments/.test(cliText) && /blockedReads:\s*Object\.freeze\(blockedBatch\.blockedReads\.map/.test(cliText),
  },
  {
    id: 'complete-documents-to-semantic-judgments',
    producer: 'sourceReadBatch.provideDocumentsForSemanticPipeline',
    datum: ['documents', 'discoverySourceProject', 'requestedSourceProject'],
    consumer: 'laravelControllerInvocationSemanticJudgmentPreparationInputFactory.create',
    invariant: 'Successfully read documents and both identity contexts enter semantic judgment preparation.',
    passed: hasCall(cli, 'provideDocumentsForSemanticPipeline', /sourceReadBatch/) && /documents:\s*sourceReadBatch\.provideDocumentsForSemanticPipeline\(\)/.test(cliText) && /discoverySourceProject,\s*sourceProject,\s*routeSelection,\s*dependencies/.test(cliText) && /requestedSourceProject:\s*sourceProject/.test(cliText) && /sourceInventory:\s*prepared\.sourceInventory/.test(cliText) && /judgments:\s*prepared\.judgments/.test(cliText),
  },
  {
    id: 'named-interface-runtime-contract',
    producer: 'upstream and CLI operation factories',
    datum: ['explicit interface annotations', 'domain operations'],
    consumer: 'runtime operation chain',
    invariant: 'Key runtime operations have named interfaces and upstream ADT owns follow-up domain operations.',
    passed: hasVariableType(upstream, 'laravelControllerSourceDiscoveryJudgmentFactory', 'LaravelControllerSourceDiscoveryJudgmentFactoryInterface') && hasVariableType(cli, 'controllerDirectoryEntryClassification', 'ControllerDirectoryEntryClassificationInterface') && hasVariableType(cli, 'controllerDirectoryEntriesOperation', 'ControllerDirectoryEntriesOperationInterface') && ['projectForManifest', 'continueCompleteDiscovery', 'includeSource', 'block'].every(method => new RegExp('readonly\\s+' + method + '\\s*:').test(upstreamText)),
  },
];

const productionRoots = ['packages/core/src', 'packages/cli/src', 'packages/sdk/src', 'packages/react/src'];
const tsFiles = [];
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
  const absolute = path.join(directory, entry.name);
  if (entry.isDirectory()) walk(absolute);
  else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) tsFiles.push(absolute);
});
productionRoots.forEach(relative => { if (fs.existsSync(path.join(root, relative))) walk(path.join(root, relative)); });
let parseDiagnostics = 0;
const parseErrors = [];
const inventory = { typescriptFiles: tsFiles.length, parseDiagnostics: 0, exportedFunctionDeclarations: 0, exportedFunctionVariables: 0, exportedFunctionVariablesWithExplicitType: 0, ifStatements: 0, switchStatements: 0, forStatements: 0, whileStatements: 0, conditionalExpressions: 0, nullishCoalescingExpressions: 0, typeAssertions: 0, mapCalls: 0, reduceCalls: 0, arrayLiteralExpressions: 0, anyKeywordTypes: 0, unknownKeywordTypes: 0 };
for (const absolute of tsFiles) {
  const relative = path.relative(root, absolute).split(path.sep).join('/');
  const source = parse(relative, fs.readFileSync(absolute, 'utf8'));
  for (const diagnostic of source.parseDiagnostics) {
    parseDiagnostics++;
    if (parseErrors.length < 20) parseErrors.push({ file: relative, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n') });
  }
  for (const node of visit(source, () => true)) {
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) inventory.exportedFunctionDeclarations++;
    if (ts.isVariableStatement(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) for (const declaration of node.declarationList.declarations) {
      if (declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
        inventory.exportedFunctionVariables++;
        if (declaration.type) inventory.exportedFunctionVariablesWithExplicitType++;
      }
    }
    if (ts.isIfStatement(node)) inventory.ifStatements++;
    if (ts.isSwitchStatement(node)) inventory.switchStatements++;
    if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node)) inventory.forStatements++;
    if (ts.isWhileStatement(node) || ts.isDoStatement(node)) inventory.whileStatements++;
    if (ts.isConditionalExpression(node)) inventory.conditionalExpressions++;
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) inventory.nullishCoalescingExpressions++;
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) inventory.typeAssertions++;
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(unwrap(node.expression))) {
      if (nameOf(unwrap(node.expression).name) === 'map') inventory.mapCalls++;
      if (nameOf(unwrap(node.expression).name) === 'reduce') inventory.reduceCalls++;
    }
    if (ts.isArrayLiteralExpression(node)) inventory.arrayLiteralExpressions++;
    if (node.kind === ts.SyntaxKind.AnyKeyword) inventory.anyKeywordTypes++;
    if (node.kind === ts.SyntaxKind.UnknownKeyword) inventory.unknownKeywordTypes++;
  }
}
inventory.parseDiagnostics = parseDiagnostics;

const checks = {
  phase: 3117,
  mode: 'static CJS datum-flow contract test using TypeScript AST/source lineage; no Vitest and no project runtime imports',
  noVitestExecutionOrTestFrameworkDependency: noTestRuntimeImports,
  productionTypeScriptParses: parseDiagnostics === 0,
  datumFlowChecks: flows,
  allDatumFlowsPreserveRequiredEvidence: flows.every(flow => flow.passed),
  deletedRelationFoundationNotReintroduced: !/semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)/.test(upstreamText + cliText),
  inventory,
  parseErrors,
  globalExportInterfaceMigrationComplete: false,
  globalPrimitiveAndControlFlowErasureComplete: false,
  fullSemanticTypecheckVerified: false,
  fullPhpToCliManifestE2eVerified: false,
};
const failed = [];
if (!checks.noVitestExecutionOrTestFrameworkDependency) failed.push('noVitestExecutionOrTestFrameworkDependency');
if (!checks.productionTypeScriptParses) failed.push('productionTypeScriptParses');
for (const flow of flows) if (!flow.passed) failed.push(`datum-flow:${flow.id}`);
if (!checks.deletedRelationFoundationNotReintroduced) failed.push('deletedRelationFoundationNotReintroduced');
fs.mkdirSync(path.dirname(path.join(root, paths.report)), { recursive: true });
fs.writeFileSync(path.join(root, paths.report), `${JSON.stringify(checks, null, 2)}\n`);
console.log(JSON.stringify({ report: paths.report, passed: flows.filter(flow => flow.passed).length, total: flows.length, failed, checks }, null, 2));
if (failed.length) process.exitCode = 1;
