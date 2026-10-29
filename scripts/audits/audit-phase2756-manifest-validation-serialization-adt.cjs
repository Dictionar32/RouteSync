const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const files = [
  'packages/cli/src/generators/ManifestContractValidator.ts',
  'packages/cli/src/generators/ManifestSerializer.ts',
  'packages/cli/src/generators/ManifestGenerator.ts',
  'packages/cli/src/commands/scan.ts',
];
const sources = new Map(files.map(file => [file, ts.createSourceFile(file, fs.readFileSync(path.join(root, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)]));
const text = file => fs.readFileSync(path.join(root, file), 'utf8');
const syntaxDiagnostics = [...sources.values()].reduce((sum, source) => sum + source.parseDiagnostics.length, 0);
const exportedFunctionShapes = [];
for (const [file, source] of sources) for (const node of source.statements) {
  if (!node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
  if (ts.isFunctionDeclaration(node) && node.name) exportedFunctionShapes.push(`${file}:${node.name.text}`);
  if (ts.isVariableStatement(node)) for (const declaration of node.declarationList.declarations) {
    if (ts.isIdentifier(declaration.name) && declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
      if (!declaration.type) exportedFunctionShapes.push(`${file}:${declaration.name.text}:missing-explicit-interface-type`);
    }
  }
}
const validator = text(files[0]);
const serializer = text(files[1]);
const scan = text(files[3]);
const checks = {
  changedRuntimeFilesParse: syntaxDiagnostics === 0,
  noExportedFreeFunctionInManifestRuntimeSlice: exportedFunctionShapes.length === 0,
  validatorHasClosedSuccessFailureADT: /ManifestContractValidationJudgment\s*=\s*[\s\S]*'manifest_contract_validated'[\s\S]*'manifest_contract_rejected'/.test(validator),
  validatorEntryIsExplicitlyTypedObject: /export const manifestContractValidationOperations:\s*ManifestContractValidationOperationsInterface\s*=\s*Object\.freeze/.test(validator),
  serializerEntryIsExplicitlyTypedObject: /export const manifestSerializationOperations:\s*ManifestSerializationOperationsInterface\s*=\s*Object\.freeze/.test(serializer),
  generatorUsesSerializationOperation: /manifestSerializationOperations\.serialize\(validation\.manifest\)/.test(text(files[2])),
  scanConsumesValidationADT: /manifestContractValidationOperations\.validate\(resolvedManifest\)/.test(scan) && /case 'manifest_contract_rejected'/.test(scan),
  scanExhaustivelyHandlesValidationJudgment: /const exhaustive: never = manifestContractJudgment/.test(scan),
};
for (const [name, passed] of Object.entries(checks)) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`Phase 2756 manifest validation/serialization ADT audit: ${Object.values(checks).filter(Boolean).length}/${Object.keys(checks).length} checks passed`);
console.log(`Static AST audit only; syntax diagnostics: ${syntaxDiagnostics}; exported-function findings: ${exportedFunctionShapes.length}`);
for (const finding of exportedFunctionShapes) console.log(`REMAIN ${finding}`);
if (Object.values(checks).some(passed => !passed)) process.exit(1);
