#!/usr/bin/env node
'use strict';

// Static contract audit: reads production TypeScript interfaces and implementation ASTs only.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const upstreamRelative = 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts';
const cliRelative = 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts';
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const parse = (relative, source) => ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true, relative.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const upstreamText = read(upstreamRelative);
const cliText = read(cliRelative);
const upstream = parse(upstreamRelative, upstreamText);
const cli = parse(cliRelative, cliText);

const visit = (node, predicate, results = []) => {
  if (predicate(node)) results.push(node);
  ts.forEachChild(node, child => { visit(child, predicate, results); });
  return results;
};
const identifierName = node => node && ts.isIdentifier(node) ? node.text : undefined;
const propertyName = node => node && (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) ? node.text : undefined;
const findNamed = (source, predicate, name) => visit(source, node => predicate(node) && identifierName(node.name) === name)[0];
const interfacePropertyNames = declaration => new Set((declaration?.members ?? []).filter(ts.isPropertySignature).map(member => propertyName(member.name)));
const hasObjectProperty = (objectLiteral, name) => !!objectLiteral && ts.isObjectLiteralExpression(objectLiteral) && objectLiteral.properties.some(property => ts.isPropertyAssignment(property) && propertyName(property.name) === name);
const getObjectProperty = (objectLiteral, name) => objectLiteral && ts.isObjectLiteralExpression(objectLiteral) ? objectLiteral.properties.find(property => ts.isPropertyAssignment(property) && propertyName(property.name) === name) : undefined;
const unwrap = expression => {
  let current = expression;
  while (current && (ts.isParenthesizedExpression(current) || ts.isAsExpression(current) || ts.isTypeAssertionExpression(current) || ts.isSatisfiesExpression(current))) current = current.expression;
  return current;
};
const functionBody = expression => {
  const current = unwrap(expression);
  return current && (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) ? current.body : undefined;
};
const returnsIdentifier = expression => {
  const body = functionBody(expression);
  if (!body) return false;
  if (ts.isIdentifier(unwrap(body))) return true;
  if (!ts.isBlock(body)) return false;
  return body.statements.some(statement => ts.isReturnStatement(statement) && statement.expression && ts.isIdentifier(unwrap(statement.expression)));
};
const objectLiteralInitializer = node => {
  const expression = unwrap(node);
  if (expression && ts.isObjectLiteralExpression(expression)) return expression;
  if (expression && ts.isCallExpression(expression) && ts.isPropertyAccessExpression(expression.expression) && propertyName(expression.expression.name) === 'freeze') return objectLiteralInitializer(expression.arguments[0]);
  return undefined;
};
const findFactoryObject = factoryName => {
  const factory = findNamed(upstream, ts.isVariableDeclaration, factoryName);
  return objectLiteralInitializer(factory?.initializer);
};
const propertyArrow = (objectLiteral, name) => getObjectProperty(objectLiteral, name)?.initializer;
const capturedJudgmentIdentityIsStaticallyPreserved = (factoryObject, factoryMethodName, closureName) => {
  const factoryMethod = propertyArrow(factoryObject, factoryMethodName);
  const methodBody = functionBody(factoryMethod);
  if (!methodBody || !ts.isBlock(methodBody)) return false;
  const judgmentDeclaration = visit(methodBody, ts.isVariableDeclaration).find(declaration => identifierName(declaration.name) === 'judgment');
  if (!judgmentDeclaration?.initializer) return false;
  const judgmentFactoryCall = unwrap(judgmentDeclaration.initializer);
  if (!ts.isCallExpression(judgmentFactoryCall) || !ts.isPropertyAccessExpression(judgmentFactoryCall.expression) || propertyName(judgmentFactoryCall.expression.name) !== 'freeze') return false;
  const judgmentObject = objectLiteralInitializer(judgmentFactoryCall.arguments[0]);
  const projectionBody = functionBody(propertyArrow(judgmentObject, 'projectForManifest'));
  if (!projectionBody) return false;
  const projectionObject = ts.isBlock(projectionBody)
    ? visit(projectionBody, ts.isReturnStatement).map(statement => objectLiteralInitializer(statement.expression)).find(Boolean)
    : objectLiteralInitializer(projectionBody);
  const closure = propertyArrow(projectionObject, closureName);
  const closureBody = functionBody(closure);
  if (!closureBody) return false;
  const returnedName = ts.isBlock(closureBody)
    ? closureBody.statements.filter(ts.isReturnStatement).map(statement => identifierName(unwrap(statement.expression))).find(Boolean)
    : identifierName(unwrap(closureBody));
  return returnedName === 'judgment' && identifierName(judgmentDeclaration.name) === returnedName;
};

const operationsInterface = findNamed(upstream, ts.isInterfaceDeclaration, 'LaravelControllerSourceDiscoveryJudgmentOperations');
const operations = interfacePropertyNames(operationsInterface);
const projectionAlias = findNamed(upstream, ts.isTypeAliasDeclaration, 'LaravelControllerSourceDiscoveryManifestProjection');
const projectionMembers = projectionAlias ? visit(projectionAlias.type, ts.isPropertySignature) : [];
const projectionPropertyNames = new Set(projectionMembers.map(member => propertyName(member.name)));
const discoveryFactory = findFactoryObject('laravelControllerSourceDiscoveryJudgmentFactory');
const cliCalls = visit(cli, ts.isCallExpression);
const cliUsesDiscovery = cliCalls.some(call => ts.isPropertyAccessExpression(unwrap(call.expression)) && propertyName(unwrap(call.expression).name) === 'discover' && /sourceDiscovery/.test(unwrap(call.expression).expression.getText(cli)));
const cliUsesProjection = cliCalls.some(call => ts.isPropertyAccessExpression(unwrap(call.expression)) && propertyName(unwrap(call.expression).name) === 'projectForManifest');
const cliUsesBlockedJudgment = /preserveBlockedJudgment\(\)/.test(cliText);
const cliContinuesCompleteSources = /discoveredSources:\s*manifestProjection\.sources/.test(cliText);

const sourceRoots = ['packages/core/src', 'packages/cli/src', 'packages/sdk/src', 'packages/react/src'];
const sourceFiles = [];
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) sourceFiles.push(absolute);
  }
};
for (const relative of sourceRoots) if (fs.existsSync(path.join(root, relative))) walk(path.join(root, relative));
const astInventory = { typescriptFiles: sourceFiles.length, exportedFunctionDeclarations: 0, exportedArrowOrFunctionExpressionVariables: 0, genericContinueWithArrowImplementations: 0, ifStatements: 0, switchStatements: 0, conditionalExpressions: 0, nullishCoalescingExpressions: 0 };
for (const file of sourceFiles) {
  const source = parse(path.relative(root, file), fs.readFileSync(file, 'utf8'));
  for (const node of visit(source, () => true)) {
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) astInventory.exportedFunctionDeclarations++;
    if (ts.isVariableStatement(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) for (const declaration of node.declarationList.declarations) if (declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) astInventory.exportedArrowOrFunctionExpressionVariables++;
    if (ts.isArrowFunction(node) && node.typeParameters?.some(parameter => parameter.name.text === 'Result') && node.parent && ts.isPropertyAssignment(node.parent) && propertyName(node.parent.name) === 'continueWith') astInventory.genericContinueWithArrowImplementations++;
    if (ts.isIfStatement(node)) astInventory.ifStatements++;
    if (ts.isSwitchStatement(node)) astInventory.switchStatements++;
    if (ts.isConditionalExpression(node)) astInventory.conditionalExpressions++;
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) astInventory.nullishCoalescingExpressions++;
  }
}

const checks = {
  phase: 3115,
  auditMode: 'static TypeScript AST and interface-contract inspection; no test runner execution',
  staticAuditHasNoTestFileDependency: !upstreamRelative.endsWith('.test.ts') && !cliRelative.endsWith('.test.ts'),
  upstreamInterfaceDeclaresExplicitDomainOperations: ['projectForManifest', 'continueCompleteDiscovery', 'includeSource', 'block'].every(name => operations.has(name)),
  manifestProjectionDeclaresBothCompleteAndBlockedOperations: ['preserveCompleteJudgment', 'preserveBlockedJudgment'].every(name => projectionPropertyNames.has(name)),
  completeProjectionCarriesTypedProjectRootAndSources: /sourceProject:\s*SourceProjectIdentity/.test(upstreamText) && /root:\s*SourceFile/.test(upstreamText) && /sources:\s*SourceFileInventory/.test(upstreamText),
  blockedProjectionCarriesPartialSourcesAndBlocker: /partialSources:\s*SourceFileInventory/.test(upstreamText) && /blocker:\s*LaravelControllerSourceDiscoveryBlocker/.test(upstreamText),
  completeFactoryProjectionReturnsCapturedJudgmentByIdentity: capturedJudgmentIdentityIsStaticallyPreserved(discoveryFactory, 'complete', 'preserveCompleteJudgment'),
  blockedFactoryProjectionReturnsCapturedJudgmentByIdentity: capturedJudgmentIdentityIsStaticallyPreserved(discoveryFactory, 'blocked', 'preserveBlockedJudgment'),
  cliRuntimeCallsSourceDiscoveryAndProjection: cliUsesDiscovery && cliUsesProjection,
  cliBlockedPathPreservesJudgmentAndCompletePathPassesSources: cliUsesBlockedJudgment && cliContinuesCompleteSources,
  noDeletedRelationFoundationRestored: !/semantic\/relations\/(relationMembership|relationalSequence|semanticRelations)/.test(upstreamText + cliText),
  astInventory,
  repositoryWideExportInterfaceMigrationComplete: false,
  repositoryWidePrimitiveAndControlFlowErasureComplete: false,
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
const required = ['staticAuditHasNoTestFileDependency', 'upstreamInterfaceDeclaresExplicitDomainOperations', 'manifestProjectionDeclaresBothCompleteAndBlockedOperations', 'completeProjectionCarriesTypedProjectRootAndSources', 'blockedProjectionCarriesPartialSourcesAndBlocker', 'completeFactoryProjectionReturnsCapturedJudgmentByIdentity', 'blockedFactoryProjectionReturnsCapturedJudgmentByIdentity', 'cliRuntimeCallsSourceDiscoveryAndProjection', 'cliBlockedPathPreservesJudgmentAndCompletePathPassesSources', 'noDeletedRelationFoundationRestored'];
const failed = required.filter(name => checks[name] !== true);
const reportRelative = 'reports/PHASE3115_STATIC_UPSTREAM_INTERFACE_AUDIT.json';
fs.mkdirSync(path.dirname(path.join(root, reportRelative)), { recursive: true });
fs.writeFileSync(path.join(root, reportRelative), `${JSON.stringify(checks, null, 2)}\n`);
console.log(JSON.stringify({ report: reportRelative, checks, failed }, null, 2));
if (failed.length) process.exitCode = 1;
