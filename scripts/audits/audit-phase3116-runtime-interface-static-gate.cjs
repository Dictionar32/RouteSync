#!/usr/bin/env node
'use strict';

// Static-only gate for the PHP/Laravel source-discovery -> upstream ADT -> CLI manifest path.
// Reads production source with TypeScript AST. It never imports project modules or runs Vitest.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const upstreamRelative = 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts';
const cliRelative = 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts';
const auditRelative = 'scripts/audits/audit-phase3116-runtime-interface-static-gate.cjs';
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const parse = (relative, text) => ts.createSourceFile(relative, text, ts.ScriptTarget.Latest, true, relative.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const upstreamText = read(upstreamRelative);
const cliText = read(cliRelative);
const upstream = parse(upstreamRelative, upstreamText);
const cli = parse(cliRelative, cliText);
const visit = (node, predicate, found = []) => {
  if (predicate(node)) found.push(node);
  ts.forEachChild(node, child => { visit(child, predicate, found); });
  return found;
};
const nameOf = node => node && (ts.isIdentifier(node) || ts.isStringLiteral(node)) ? node.text : undefined;
const findNamed = (source, predicate, name) => visit(source, node => predicate(node) && nameOf(node.name) === name)[0];
const unwrap = expression => {
  let current = expression;
  while (current && (ts.isParenthesizedExpression(current) || ts.isAsExpression(current) || ts.isTypeAssertionExpression(current) || ts.isSatisfiesExpression(current))) current = current.expression;
  return current;
};
const objectInitializer = expression => {
  const current = unwrap(expression);
  if (current && ts.isObjectLiteralExpression(current)) return current;
  if (current && ts.isCallExpression(current) && ts.isPropertyAccessExpression(current.expression) && nameOf(current.expression.name) === 'freeze') return objectInitializer(current.arguments[0]);
  return undefined;
};
const property = (object, name) => object && object.properties.find(member => ts.isPropertyAssignment(member) && nameOf(member.name) === name);
const fnBody = expression => {
  const current = unwrap(expression);
  return current && (ts.isArrowFunction(current) || ts.isFunctionExpression(current)) ? current.body : undefined;
};
const directReturnedIdentifier = expression => {
  const body = fnBody(expression);
  if (!body) return undefined;
  if (!ts.isBlock(body)) return nameOf(unwrap(body));
  return body.statements.filter(ts.isReturnStatement).map(statement => nameOf(unwrap(statement.expression))).find(Boolean);
};
const interfaceMembers = declaration => new Set((declaration?.members ?? []).map(member => nameOf(member.name)).filter(Boolean));
const operationsInterface = findNamed(upstream, ts.isInterfaceDeclaration, 'LaravelControllerSourceDiscoveryJudgmentOperations');
const projection = findNamed(upstream, ts.isTypeAliasDeclaration, 'LaravelControllerSourceDiscoveryManifestProjection');
const projectionProperties = new Set(projection ? visit(projection.type, ts.isPropertySignature).map(member => nameOf(member.name)).filter(Boolean) : []);
const factoryDeclaration = findNamed(upstream, ts.isVariableDeclaration, 'laravelControllerSourceDiscoveryJudgmentFactory');
const factoryObject = objectInitializer(factoryDeclaration?.initializer);
const cliCalls = visit(cli, ts.isCallExpression);
const callUses = name => cliCalls.some(call => ts.isPropertyAccessExpression(unwrap(call.expression)) && nameOf(unwrap(call.expression).name) === name);
const cliCallsSourceDiscovery = cliCalls.some(call => {
  const expression = unwrap(call.expression);
  return ts.isPropertyAccessExpression(expression) && nameOf(expression.name) === 'discover' && /sourceDiscovery/.test(expression.expression.getText(cli));
});
const sourceRoots = ['packages/core/src', 'packages/cli/src', 'packages/sdk/src', 'packages/react/src'];
const files = [];
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
  const absolute = path.join(directory, entry.name);
  if (entry.isDirectory()) walk(absolute);
  else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) files.push(absolute);
});
sourceRoots.forEach(relative => { if (fs.existsSync(path.join(root, relative))) walk(path.join(root, relative)); });

const inventory = {
  typescriptFiles: files.length,
  parseDiagnostics: 0,
  exportedFunctionDeclarations: 0,
  exportedArrowOrFunctionExpressionVariables: 0,
  exportedArrowOrFunctionExpressionVariablesWithExplicitType: 0,
  genericContinueWithArrowImplementations: 0,
  ifStatements: 0,
  switchStatements: 0,
  forStatements: 0,
  whileStatements: 0,
  conditionalExpressions: 0,
  nullishCoalescingExpressions: 0,
  typeAssertions: 0,
  nonNullExpressions: 0,
  mapCalls: 0,
  reduceCalls: 0,
  arrayLiteralExpressions: 0,
  anyKeywordTypes: 0,
  unknownKeywordTypes: 0,
};
const parseErrors = [];
for (const absolute of files) {
  const relative = path.relative(root, absolute).split(path.sep).join('/');
  const source = parse(relative, fs.readFileSync(absolute, 'utf8'));
  for (const diagnostic of source.parseDiagnostics) {
    inventory.parseDiagnostics++;
    if (parseErrors.length < 25) parseErrors.push({ file: relative, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n') });
  }
  for (const node of visit(source, () => true)) {
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) inventory.exportedFunctionDeclarations++;
    if (ts.isVariableStatement(node) && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const declaration of node.declarationList.declarations) {
        if (declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
          inventory.exportedArrowOrFunctionExpressionVariables++;
          if (declaration.type) inventory.exportedArrowOrFunctionExpressionVariablesWithExplicitType++;
        }
      }
    }
    if (ts.isArrowFunction(node) && node.typeParameters?.some(parameter => parameter.name.text === 'Result') && node.parent && ts.isPropertyAssignment(node.parent) && nameOf(node.parent.name) === 'continueWith') inventory.genericContinueWithArrowImplementations++;
    if (ts.isIfStatement(node)) inventory.ifStatements++;
    if (ts.isSwitchStatement(node)) inventory.switchStatements++;
    if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node)) inventory.forStatements++;
    if (ts.isWhileStatement(node) || ts.isDoStatement(node)) inventory.whileStatements++;
    if (ts.isConditionalExpression(node)) inventory.conditionalExpressions++;
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) inventory.nullishCoalescingExpressions++;
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) inventory.typeAssertions++;
    if (ts.isNonNullExpression(node)) inventory.nonNullExpressions++;
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(unwrap(node.expression))) {
      const method = nameOf(unwrap(node.expression).name);
      if (method === 'map') inventory.mapCalls++;
      if (method === 'reduce') inventory.reduceCalls++;
    }
    if (ts.isArrayLiteralExpression(node)) inventory.arrayLiteralExpressions++;
    if (node.kind === ts.SyntaxKind.AnyKeyword) inventory.anyKeywordTypes++;
    if (node.kind === ts.SyntaxKind.UnknownKeyword) inventory.unknownKeywordTypes++;
  }
}

const requiredFactoryInterface = 'LaravelControllerSourceDiscoveryJudgmentFactoryInterface';
const runtimeTypedFactories = [
  ['packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts', 'controllerSourceProjectIdentityCanonicalization', 'ControllerSourceProjectIdentityCanonicalizationInterface'],
  ['packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts', 'controllerDirectoryEntryClassification', 'ControllerDirectoryEntryClassificationInterface'],
  ['packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts', 'controllerDirectoryEntriesOperation', 'ControllerDirectoryEntriesOperationInterface'],
  ['packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts', 'controllerPhpSourceDiscoveryOperation', 'ControllerPhpSourceDiscoveryOperationInterface'],
];
const typedDeclaration = (relative, variableName, typeName) => {
  const source = relative === upstreamRelative ? upstream : relative === cliRelative ? cli : parse(relative, read(relative));
  const declaration = findNamed(source, ts.isVariableDeclaration, variableName);
  return !!declaration?.type && ts.isTypeReferenceNode(declaration.type) && nameOf(declaration.type.typeName) === typeName;
};
const judgmentFactoryTyped = !!factoryDeclaration?.type && ts.isTypeReferenceNode(factoryDeclaration.type) && nameOf(factoryDeclaration.type.typeName) === requiredFactoryInterface;
const closureReturnsCaptured = (factoryObjectValue, methodName, closureName) => {
  const methodBody = fnBody(property(factoryObjectValue, methodName)?.initializer);
  if (!methodBody || !ts.isBlock(methodBody)) return false;
  const judgmentDeclaration = visit(methodBody, ts.isVariableDeclaration).find(declaration => nameOf(declaration.name) === 'judgment');
  if (!judgmentDeclaration) return false;
  const frozenJudgment = objectInitializer(judgmentDeclaration.initializer?.arguments?.[0]);
  const projectBody = fnBody(property(frozenJudgment, 'projectForManifest')?.initializer);
  const projectionObject = projectBody && (ts.isBlock(projectBody)
    ? visit(projectBody, ts.isReturnStatement).map(statement => objectInitializer(statement.expression)).find(Boolean)
    : objectInitializer(projectBody));
  return directReturnedIdentifier(property(projectionObject, closureName)?.initializer) === 'judgment';
};
const forbiddenFoundationReferences = /semantic\/relations\/(?:relationMembership|relationalSequence|semanticRelations)/;
const checks = {
  phase: 3116,
  auditMode: 'static TypeScript AST contract and syntax inventory; no Vitest or project runtime imports',
  noVitestExecutionOrTestFileDependency: !/vitest|\.test\.tsx?$/.test(upstreamRelative + cliRelative + auditRelative),
  allScannedProductionTypeScriptFilesParse: inventory.parseDiagnostics === 0,
  upstreamFactoryHasNamedInterfaceAnnotation: judgmentFactoryTyped,
  upstreamADTDeclaresExplicitDomainOperations: ['projectForManifest', 'continueCompleteDiscovery', 'includeSource', 'block'].every(name => interfaceMembers(operationsInterface).has(name)),
  completeAndBlockedProjectionDeclarePreservationOperations: ['preserveCompleteJudgment', 'preserveBlockedJudgment'].every(name => projectionProperties.has(name)),
  completeProjectionReturnsCapturedJudgmentReference: closureReturnsCaptured(factoryObject, 'complete', 'preserveCompleteJudgment'),
  blockedProjectionReturnsCapturedJudgmentReference: closureReturnsCaptured(factoryObject, 'blocked', 'preserveBlockedJudgment'),
  cliRuntimeCallsSourceDiscoveryAndProjection: cliCallsSourceDiscovery && callUses('projectForManifest'),
  cliBlockedPathPreservesJudgmentAndCompletePathPassesSources: /preserveBlockedJudgment\(\)/.test(cliText) && /discoveredSources:\s*manifestProjection\.sources/.test(cliText),
  cliRuntimeFactoriesHaveNamedInterfaceAnnotations: runtimeTypedFactories.every(([relative, variableName, typeName]) => typedDeclaration(relative, variableName, typeName)),
  deletedRelationFoundationRemainsAbsentFromRuntimeFiles: !forbiddenFoundationReferences.test(upstreamText + cliText),
  astInventory: inventory,
  parseErrors,
  repositoryWideExportInterfaceMigrationComplete: false,
  repositoryWidePrimitiveAndControlFlowErasureComplete: false,
  fullSemanticTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
const required = [
  'noVitestExecutionOrTestFileDependency',
  'allScannedProductionTypeScriptFilesParse',
  'upstreamFactoryHasNamedInterfaceAnnotation',
  'upstreamADTDeclaresExplicitDomainOperations',
  'completeAndBlockedProjectionDeclarePreservationOperations',
  'completeProjectionReturnsCapturedJudgmentReference',
  'blockedProjectionReturnsCapturedJudgmentReference',
  'cliRuntimeCallsSourceDiscoveryAndProjection',
  'cliBlockedPathPreservesJudgmentAndCompletePathPassesSources',
  'cliRuntimeFactoriesHaveNamedInterfaceAnnotations',
  'deletedRelationFoundationRemainsAbsentFromRuntimeFiles',
];
const failed = required.filter(name => checks[name] !== true);
const reportRelative = 'reports/PHASE3116_RUNTIME_INTERFACE_STATIC_GATE.json';
fs.mkdirSync(path.dirname(path.join(root, reportRelative)), { recursive: true });
fs.writeFileSync(path.join(root, reportRelative), `${JSON.stringify(checks, null, 2)}\n`);
console.log(JSON.stringify({ report: reportRelative, checks, failed }, null, 2));
if (failed.length) process.exitCode = 1;
