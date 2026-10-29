#!/usr/bin/env node
'use strict';

// Phase 3119: static migration gate for semantic value factories. CJS + TypeScript AST only; no Vitest or project runtime imports.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const sourcePath = 'packages/core/src/types/upstream/semanticDataflowKnowledge.ts';
const sourceText = fs.readFileSync(path.join(root, sourcePath), 'utf8');
const source = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const migrated = Object.freeze({
  semanticText: 'SemanticTextFactoryInterface',
  semanticNumber: 'SemanticNumberFactoryInterface',
  semanticBoolean: 'SemanticBooleanFactoryInterface',
  semanticSourceOffset: 'SemanticSourceOffsetFactoryInterface',
  semanticSourceSpan: 'SemanticSourceSpanFactoryInterface',
});
const found = [];
const visit = node => {
  if (ts.isInterfaceDeclaration(node)) found.push({ kind: 'interface', name: node.name.text, node });
  if (ts.isVariableStatement(node)) {
    for (const declaration of node.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) found.push({ kind: 'variable', name: declaration.name.text, node: declaration, statement: node });
    }
  }
  ts.forEachChild(node, visit);
};
visit(source);
const interfaceFor = name => found.find(item => item.kind === 'interface' && item.name === name);
const variableFor = name => found.find(item => item.kind === 'variable' && item.name === name);
const unwrap = node => {
  let current = node;
  while (current && (ts.isParenthesizedExpression(current) || ts.isAsExpression(current) || ts.isSatisfiesExpression(current))) current = current.expression;
  return current;
};
const objectLiteral = node => {
  let current = unwrap(node);
  if (current && ts.isCallExpression(current) && ts.isPropertyAccessExpression(current.expression) && current.expression.expression.getText(source) === 'Object' && current.expression.name.text === 'freeze') current = unwrap(current.arguments[0]);
  return current && ts.isObjectLiteralExpression(current) ? current : undefined;
};
const checks = [];
for (const [factory, contract] of Object.entries(migrated)) {
  const interfaceDeclaration = interfaceFor(contract)?.node;
  const declaration = variableFor(factory)?.node;
  const initializer = declaration && objectLiteral(declaration.initializer);
  const create = initializer?.properties.find(property => (ts.isPropertyAssignment(property) || ts.isMethodDeclaration(property)) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) && property.name.text === 'create');
  checks.push({ check: `${factory} has named domain interface`, passed: Boolean(interfaceDeclaration) });
  checks.push({ check: `${factory} export is annotated with ${contract}`, passed: Boolean(declaration?.type && ts.isTypeReferenceNode(declaration.type) && declaration.type.typeName.getText(source) === contract) });
  checks.push({ check: `${factory} factory exposes create operation`, passed: Boolean(create) });
}
const packageFiles = [];
const collect = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(full);
    else if (entry.isFile() && entry.name.endsWith('.ts')) packageFiles.push(full);
  }
};
collect(path.join(root, 'packages'));
const legacyCalls = [];
let parsedFiles = 0;
for (const file of packageFiles) {
  const text = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  parsedFiles += 1;
  const walk = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && Object.hasOwn(migrated, node.expression.text)) {
      const line = ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
      legacyCalls.push({ file: path.relative(root, file), line, factory: node.expression.text });
    }
    ts.forEachChild(node, walk);
  };
  walk(ast);
}
checks.push({ check: 'all package TypeScript files parse', passed: parsedFiles > 0 && packageFiles.every(file => { const text = fs.readFileSync(file, 'utf8'); const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS); return ast.parseDiagnostics.length === 0; }), value: parsedFiles });
checks.push({ check: 'no legacy direct calls remain for migrated factories', passed: legacyCalls.length === 0, value: legacyCalls });
const report = {
  phase: 3119,
  title: 'Semantic Value Factory Interface Migration',
  execution: 'static-cjs-typescript-ast-no-vitest',
  migratedFactories: Object.keys(migrated),
  packageTypeScriptFilesParsed: parsedFiles,
  legacyDirectCalls: legacyCalls,
  checks,
  failed: checks.filter(check => !check.passed),
  migrationCompleteForSelectedFactories: checks.every(check => check.passed),
  repositoryWideExportMigrationComplete: false,
};
const reportPath = path.join(root, 'reports/PHASE3119_SEMANTIC_VALUE_FACTORY_MIGRATION.json');
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
for (const check of checks) process.stdout.write(`${check.passed ? 'PASS' : 'FAIL'} ${check.check}${check.value === undefined ? '' : `: ${JSON.stringify(check.value)}`}\n`);
process.stdout.write(`Report: ${path.relative(root, reportPath)}\n`);
if (report.failed.length) process.exitCode = 1;
