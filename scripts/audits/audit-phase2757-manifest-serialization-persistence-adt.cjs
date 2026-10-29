const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const files = [
  'packages/cli/src/generators/ManifestSerializer.ts',
  'packages/cli/src/generators/ManifestGenerator.ts',
  'packages/cli/src/commands/scan.ts',
];
let syntaxDiagnostics = 0;
const sources = Object.fromEntries(files.map(file => {
  const sourceText = fs.readFileSync(path.join(root, file), 'utf8');
  const ast = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  syntaxDiagnostics += ast.parseDiagnostics.length;
  return [file, sourceText];
}));
const serializer = sources[files[0]];
const generator = sources[files[1]];
const scan = sources[files[2]];
const checks = {
  runtimeFilesParse: syntaxDiagnostics === 0,
  serializationIsClosedADT: /type ManifestSerializationJudgment\s*=\s*[\s\S]*?'manifest_serialization_complete'[\s\S]*\|\s*\{\s*readonly kind: 'manifest_serialization_rejected'/.test(serializer),
  serializerOperationHasExplicitInterface: /export const manifestSerializationOperations:\s*ManifestSerializationOperationsInterface\s*=\s*Object\.freeze/.test(serializer),
  serializerConvertsThrownFailureToRejectedArm: /catch \(error: unknown\)[\s\S]*?kind: 'manifest_serialization_rejected'/.test(serializer),
  persistenceHasClosedSuccessAndFailureADT: /type ManifestPersistenceJudgment\s*=\s*[\s\S]*?'manifest_persistence_complete'[\s\S]*?'manifest_persistence_serialization_rejected'[\s\S]*?'manifest_persistence_write_rejected'/.test(generator),
  generatorExhaustivelyHandlesSerializationADT: /switch \(serialization\.kind\)[\s\S]*?const exhaustive: never = serialization/.test(generator),
  generatorReturnsWriteFailureADT: /kind: 'manifest_persistence_write_rejected'/.test(generator),
  scanExhaustivelyHandlesPersistenceADT: /switch \(persistenceJudgment\.kind\)[\s\S]*?const exhaustive: never = persistenceJudgment/.test(scan),
  scanStopsOnSerializationOrWriteFailure: /manifest_persistence_serialization_rejected[\s\S]*?process\.exitCode = 1[\s\S]*?return[\s\S]*?manifest_persistence_write_rejected/.test(scan),
};
for (const [name, passed] of Object.entries(checks)) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`Runtime files: ${files.length}; syntax diagnostics: ${syntaxDiagnostics}`);
console.log(`Phase 2757 manifest serialization/persistence ADT audit: ${Object.values(checks).filter(Boolean).length}/${Object.keys(checks).length} checks passed`);
console.log('Static AST/source audit only; semantic typecheck, unit tests, build, and CLI E2E remain separate verification steps.');
if (Object.values(checks).some(passed => !passed)) process.exit(1);
