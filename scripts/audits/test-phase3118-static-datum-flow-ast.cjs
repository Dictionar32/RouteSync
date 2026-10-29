#!/usr/bin/env node
'use strict';

// Phase 3118: AST-backed static datum-flow test. No Vitest, project imports, or runtime execution.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const paths = Object.freeze({
  upstream: 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts',
  inventory: 'packages/core/src/types/upstream/names.ts',
  cli: 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  report: 'reports/PHASE3118_STATIC_DATUM_FLOW_AST.json',
});
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const parse = (relative, text) => ts.createSourceFile(relative, text, ts.ScriptTarget.Latest, true, relative.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const sources = Object.fromEntries(Object.entries(paths).filter(([key]) => key !== 'report').map(([key, relative]) => [key, parse(relative, read(relative))]));
const visit = (node, predicate, found = []) => {
  if (predicate(node)) found.push(node);
  ts.forEachChild(node, child => { visit(child, predicate, found); });
  return found;
};
const nameOf = node => node && (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) ? node.text : undefined;
const unwrap = expression => {
  let current = expression;
  while (current && (ts.isParenthesizedExpression(current) || ts.isAsExpression(current) || ts.isTypeAssertionExpression(current) || ts.isSatisfiesExpression(current) || ts.isNonNullExpression(current))) current = current.expression;
  return current;
};
const expressionPath = expression => {
  const current = unwrap(expression);
  if (!current) return [];
  if (ts.isIdentifier(current)) return [current.text];
  if (ts.isCallExpression(current)) return expressionPath(current.expression);
  if (ts.isPropertyAccessExpression(current)) return [...expressionPath(current.expression), current.name.text];
  if (ts.isElementAccessExpression(current) && current.argumentExpression) return [...expressionPath(current.expression), nameOf(unwrap(current.argumentExpression))];
  return [];
};
const findNamed = (source, predicate, name) => visit(source, node => predicate(node) && nameOf(node.name) === name)[0];
const objectValue = expression => {
  const current = unwrap(expression);
  if (!current) return undefined;
  if (ts.isObjectLiteralExpression(current)) return current;
  if (ts.isCallExpression(current) && expressionPath(current.expression).join('.') === 'Object.freeze') return objectValue(current.arguments[0]);
  return undefined;
};
const members = object => object?.properties ?? [];
const getProperty = (object, propertyName) => members(object).find(member =>
  (ts.isPropertyAssignment(member) || ts.isShorthandPropertyAssignment(member) || ts.isMethodDeclaration(member)) && nameOf(member.name) === propertyName,
);
const propertyInitializer = (object, propertyName) => {
  const member = getProperty(object, propertyName);
  if (member && ts.isPropertyAssignment(member)) return member.initializer;
  if (member && ts.isShorthandPropertyAssignment(member)) return member.name;
  return undefined;
};
const variable = (source, variableName) => findNamed(source, ts.isVariableDeclaration, variableName);
const variableObject = (source, variableName) => objectValue(variable(source, variableName)?.initializer);
const callableBody = expression => {
  const current = unwrap(expression);
  return current && (ts.isArrowFunction(current) || ts.isFunctionExpression(current) || ts.isMethodDeclaration(current)) ? current.body : undefined;
};
const operationBody = (source, variableName, operationName) => callableBody(propertyInitializer(variableObject(source, variableName), operationName));
const callNodes = node => node ? visit(node, ts.isCallExpression) : [];
const hasCallPath = (node, expectedPath) => callNodes(node).some(call => expressionPath(call.expression).join('.') === expectedPath);
const callsAtPath = (node, expectedPath) => callNodes(node).filter(call => expressionPath(call.expression).join('.') === expectedPath);
const firstObjectArgument = call => objectValue(call?.arguments?.[0]);
const objectHasPath = (object, key, expectedPath) => expressionPath(propertyInitializer(object, key)).join('.') === expectedPath;
const hasIdentifier = (node, expected) => !!node && visit(node, ts.isIdentifier).some(identifier => identifier.text === expected);
const propertySignatureNames = declaration => new Set((declaration?.members ?? []).map(member => nameOf(member.name)).filter(Boolean));
const typeReferenceName = declaration => declaration?.type && ts.isTypeReferenceNode(declaration.type) ? nameOf(declaration.type.typeName) : undefined;
const auditScriptText = fs.readFileSync(__filename, 'utf8');
const noVitestDependency = !visit(sources.cli, ts.isImportDeclaration).some(declaration => /vitest/.test(declaration.moduleSpecifier.text)) && !/require\(['\"]vitest['\"]\)/.test(auditScriptText);
const noProjectRuntimeImports = !/require\(['\"](?:@routesync\/(?:core|cli)|\.\.?\/packages\/)/.test(auditScriptText);

const cli = sources.cli;
const upstream = sources.upstream;
const inventory = sources.inventory;
const canonicalCompose = operationBody(cli, 'canonicalProjectCompositionOperation', 'compose');
const readAll = operationBody(cli, 'discoveredSourceReadSettlementOperation', 'readAll');
const continueSources = operationBody(cli, 'discoveredSourcesContinuationOperation', 'continue');
const completeContinue = operationBody(cli, 'completeDocumentsContinuationOperation', 'continue');
const discoveryOperations = findNamed(upstream, ts.isInterfaceDeclaration, 'LaravelControllerSourceDiscoveryJudgmentOperations');
const inventoryOperations = findNamed(inventory, ts.isInterfaceDeclaration, 'SourceFileInventoryOperations');
const projectionAlias = findNamed(upstream, ts.isTypeAliasDeclaration, 'LaravelControllerSourceDiscoveryManifestProjection');
const projectionPropertyNames = new Set(projectionAlias ? visit(projectionAlias.type, ts.isPropertySignature).map(member => nameOf(member.name)).filter(Boolean) : []);
const discoveryFactory = variable(upstream, 'laravelControllerSourceDiscoveryJudgmentFactory');
const inventoryFactory = variable(inventory, 'sourceFileInventoryFactory');

const discoveryCall = callsAtPath(canonicalCompose, 'dependencies.sourceDiscovery.discover')[0];
const discoveryInput = firstObjectArgument(discoveryCall);
const projectionCall = callsAtPath(canonicalCompose, 'discovery.projectForManifest')[0];
const blockedIf = canonicalCompose && visit(canonicalCompose, ts.isIfStatement).find(statement =>
  expressionPath(statement.expression.left).join('.') === 'manifestProjection.kind' &&
  ts.isBinaryExpression(statement.expression) && statement.expression.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken &&
  ts.isStringLiteral(unwrap(statement.expression.right)) && unwrap(statement.expression.right).text === 'laravel_controller_source_discovery_manifest_blocked',
);
const blockedReturnCall = blockedIf && callsAtPath(blockedIf.thenStatement, 'controllerInvocationManifestTerminalOperationsFactory.sourceDiscoveryBlocked')[0];
const blockedTerminalInput = firstObjectArgument(blockedReturnCall);
const completeContinuationCall = callsAtPath(canonicalCompose, 'discoveredSourcesContinuationOperation.continue')[0];
const completeContinuationInput = firstObjectArgument(completeContinuationCall);

const readMapCall = callsAtPath(readAll, 'sources.toSourceFiles')[0];
const mapCall = callNodes(readAll).find(call => expressionPath(call.expression).join('.') === 'sources.toSourceFiles');
const mapInvocation = callNodes(readAll).find(call => expressionPath(call.expression).join('.') === 'sources.toSourceFiles.map');
const mapCallback = mapInvocation?.arguments?.[0];
const mapCallbackBody = callableBody(mapCallback);
const readerCall = callsAtPath(mapCallbackBody, 'reader.read')[0];
const readInput = firstObjectArgument(readerCall);
const settlementFulfilled = callsAtPath(mapCallbackBody, 'phpSourceDocumentReadOperationSettlementFactory.fulfilled')[0];
const settlementRejected = callsAtPath(mapCallbackBody, 'phpSourceDocumentReadOperationSettlementFactory.rejected')[0];
const sourceReadBatchCalls = callsAtPath(continueSources, 'sourceReadBatch.provideDocumentsForSemanticPipeline');
const completeDocumentsHandoff = callsAtPath(continueSources, 'completeDocumentsContinuationOperation.continue')[0];
const completeDocumentsHandoffInput = firstObjectArgument(completeDocumentsHandoff);
const preparationCall = callsAtPath(completeContinue, 'laravelControllerInvocationSemanticJudgmentPreparationInputFactory.create')[0];
const preparationInput = firstObjectArgument(preparationCall);

const roots = ['packages/core/src', 'packages/cli/src', 'packages/sdk/src', 'packages/react/src'];
const productionFiles = [];
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
  const absolute = path.join(directory, entry.name);
  if (entry.isDirectory()) walk(absolute);
  else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) productionFiles.push(absolute);
});
roots.forEach(relative => { const absolute = path.join(root, relative); if (fs.existsSync(absolute)) walk(absolute); });
const astInventory = { typescriptFiles: productionFiles.length, parseDiagnostics: 0, exportedFunctionDeclarations: 0, exportedFunctionVariables: 0, exportedFunctionVariablesWithExplicitType: 0, ifStatements: 0, switchStatements: 0, forStatements: 0, whileStatements: 0, conditionalExpressions: 0, nullishCoalescingExpressions: 0, typeAssertions: 0, mapCalls: 0, reduceCalls: 0, arrayLiteralExpressions: 0, anyKeywordTypes: 0, unknownKeywordTypes: 0 };
const parseErrors = [];
for (const absolute of productionFiles) {
  const relative = path.relative(root, absolute).split(path.sep).join('/');
  const source = parse(relative, fs.readFileSync(absolute, 'utf8'));
  for (const diagnostic of source.parseDiagnostics) {
    astInventory.parseDiagnostics++;
    if (parseErrors.length < 25) parseErrors.push({ file: relative, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n') });
  }
  for (const node of visit(source, () => true)) {
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) astInventory.exportedFunctionDeclarations++;
    if (ts.isVariableStatement(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) for (const declaration of node.declarationList.declarations) {
      if (declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
        astInventory.exportedFunctionVariables++;
        if (declaration.type) astInventory.exportedFunctionVariablesWithExplicitType++;
      }
    }
    if (ts.isIfStatement(node)) astInventory.ifStatements++;
    if (ts.isSwitchStatement(node)) astInventory.switchStatements++;
    if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node)) astInventory.forStatements++;
    if (ts.isWhileStatement(node) || ts.isDoStatement(node)) astInventory.whileStatements++;
    if (ts.isConditionalExpression(node)) astInventory.conditionalExpressions++;
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) astInventory.nullishCoalescingExpressions++;
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) astInventory.typeAssertions++;
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(unwrap(node.expression))) {
      if (nameOf(unwrap(node.expression).name) === 'map') astInventory.mapCalls++;
      if (nameOf(unwrap(node.expression).name) === 'reduce') astInventory.reduceCalls++;
    }
    if (ts.isArrayLiteralExpression(node)) astInventory.arrayLiteralExpressions++;
    if (node.kind === ts.SyntaxKind.AnyKeyword) astInventory.anyKeywordTypes++;
    if (node.kind === ts.SyntaxKind.UnknownKeyword) astInventory.unknownKeywordTypes++;
  }
}

const forbiddenFoundation = /semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)/;
const checks = {
  phase: 3118,
  mode: 'static CJS datum-flow test using TypeScript AST nodes and operation-local data lineage; no Vitest or project runtime imports',
  noVitestDependency,
  noProjectRuntimeImports,
  productionTypeScriptParses: astInventory.parseDiagnostics === 0,
  discoveryInputCarriesProjectAndRoot: !!discoveryInput && objectHasPath(discoveryInput, 'sourceProject', 'sourceProject') && objectHasPath(discoveryInput, 'root', 'sourceFileIdentityFactory.create'),
  upstreamDiscoveryProjectionIsCalledOnProducedJudgment: !!projectionCall && expressionPath(projectionCall.expression).join('.') === 'discovery.projectForManifest',
  blockedBranchIsTerminalAndCarriesOriginalJudgment: !!blockedIf && !!blockedTerminalInput && objectHasPath(blockedTerminalInput, 'discovery', 'manifestProjection.preserveBlockedJudgment') && !hasCallPath(blockedIf.thenStatement, 'discoveredSourcesContinuationOperation.continue'),
  completeBranchCarriesSameSourcesAndProjectIdentity: !!completeContinuationInput && objectHasPath(completeContinuationInput, 'discoveredSources', 'manifestProjection.sources') && objectHasPath(completeContinuationInput, 'discoverySourceProject', 'manifestProjection.sourceProject') && objectHasPath(completeContinuationInput, 'sourceProject', 'sourceProject'),
  sourceInventoryDomainDeclaresReadMaterializationOperation: propertySignatureNames(inventoryOperations).has('toSourceFiles'),
  sourceReadFanOutRetainsRequestedSourceIdentity: !!mapCallbackBody && !!readInput && objectHasPath(readInput, 'sourceFile', 'requestedSourceFile') && !!settlementFulfilled && expressionPath(settlementFulfilled.arguments[0]).join('.') === 'requestedSourceFile' && !!settlementRejected && expressionPath(settlementRejected.arguments[0]).join('.') === 'requestedSourceFile',
  rejectedReadEvidenceRetainsObservationFields: ['failureCode', 'failureName', 'failureMessage'].every(field => hasIdentifier(mapCallbackBody, field)) && hasCallPath(mapCallbackBody, 'nodeFilesystemFailureObservation.observe'),
  blockedSourceBatchCarriesPartialDocumentsAndBlockers: ['partialDocuments', 'blockedReads'].every(field => hasIdentifier(continueSources, field)) && hasCallPath(continueSources, 'sourceReadBatch.preserveBlockedEvidence'),
  semanticPreparationReceivesDocumentsAndBothProjectContexts: !!completeDocumentsHandoffInput && objectHasPath(completeDocumentsHandoffInput, 'documents', 'sourceReadBatch.provideDocumentsForSemanticPipeline') && !!preparationInput && objectHasPath(preparationInput, 'documents', 'documents') && objectHasPath(preparationInput, 'discoverySourceProject', 'discoverySourceProject') && objectHasPath(preparationInput, 'requestedSourceProject', 'sourceProject'),
  upstreamFactoryHasNamedInterfaceAnnotation: typeReferenceName(discoveryFactory) === 'LaravelControllerSourceDiscoveryJudgmentFactoryInterface',
  upstreamDeclaresDomainOperations: ['projectForManifest', 'continueCompleteDiscovery', 'includeSource', 'block'].every(name => propertySignatureNames(discoveryOperations).has(name)),
  projectionDeclaresBothJudgmentPreservationOperations: ['preserveCompleteJudgment', 'preserveBlockedJudgment'].every(name => projectionPropertyNames.has(name)),
  readAndContinuationOperationsHaveNamedInterfaces: typeReferenceName(variable(cli, 'discoveredSourceReadSettlementOperation')) === 'DiscoveredSourceReadSettlementOperationInterface' && typeReferenceName(variable(cli, 'discoveredSourcesContinuationOperation')) === 'DiscoveredSourcesContinuationOperationInterface' && typeReferenceName(variable(cli, 'completeDocumentsContinuationOperation')) === 'CompleteDocumentsContinuationOperationInterface',
  deletedRelationFoundationNotReintroduced: !forbiddenFoundation.test(read(paths.upstream) + read(paths.cli)),
  inventory: astInventory,
  parseErrors,
  repositoryWideExportInterfaceMigrationComplete: false,
  repositoryWidePrimitiveAndControlFlowErasureComplete: false,
  fullSemanticTypecheckVerified: false,
  fullPhpToCliManifestE2eVerified: false,
};
const required = Object.keys(checks).filter(key => /^(noVitestDependency|noProjectRuntimeImports|productionTypeScriptParses|discoveryInputCarriesProjectAndRoot|upstreamDiscoveryProjectionIsCalledOnProducedJudgment|blockedBranchIsTerminalAndCarriesOriginalJudgment|completeBranchCarriesSameSourcesAndProjectIdentity|sourceInventoryDomainDeclaresReadMaterializationOperation|sourceReadFanOutRetainsRequestedSourceIdentity|rejectedReadEvidenceRetainsObservationFields|blockedSourceBatchCarriesPartialDocumentsAndBlockers|semanticPreparationReceivesDocumentsAndBothProjectContexts|upstreamFactoryHasNamedInterfaceAnnotation|upstreamDeclaresDomainOperations|projectionDeclaresBothJudgmentPreservationOperations|readAndContinuationOperationsHaveNamedInterfaces|deletedRelationFoundationNotReintroduced)$/.test(key));
const failed = required.filter(key => checks[key] !== true);
fs.mkdirSync(path.dirname(path.join(root, paths.report)), { recursive: true });
fs.writeFileSync(path.join(root, paths.report), `${JSON.stringify(checks, null, 2)}\n`);
console.log(JSON.stringify({ report: paths.report, passed: required.length - failed.length, total: required.length, failed, checks }, null, 2));
if (failed.length) process.exitCode = 1;
