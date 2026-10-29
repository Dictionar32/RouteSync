const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const files = [
  'packages/cli/src/generators/ManifestGenerator.ts',
  'packages/cli/src/generators/ManifestSerializer.ts',
  'packages/cli/src/generators/ManifestContractValidator.ts',
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/commands/sync.ts',
  'scripts/scan-toko-online.ts',
];
const sources = {};
let syntaxDiagnostics = 0;
for (const file of files) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  syntaxDiagnostics += ast.parseDiagnostics.length;
  sources[file] = { text, ast };
}
const generator = sources[files[0]].text;
const serializer = sources[files[1]].text;
const validator = sources[files[2]].text;
const scan = sources[files[3]].text;
const sync = sources[files[4]].text;
const script = sources[files[5]].text;
const checks = {
  selectedRuntimeSourcesParse: syntaxDiagnostics === 0,
  generatorHasNamedOperationsInterface: /export interface ManifestGeneratorOperationsInterface/.test(generator),
  generatorExportsTypedConstObject: /export const manifestGeneratorOperations:\s*ManifestGeneratorOperationsInterface\s*=\s*Object\.freeze/.test(generator),
  generatorUsesClosedGenerationADT: /type ManifestGenerationJudgment\s*=\s*[\s\S]*?manifest_generation_complete[\s\S]*?manifest_generation_rejected/.test(generator),
  persistenceRevalidatesManifestBeforeSerialization: /manifestContractValidationOperations\.validate\(manifest\)/.test(generator) && generator.indexOf('manifestContractValidationOperations.validate(manifest)') < generator.indexOf('manifestSerializationOperations.serialize(validation.manifest)'),
  persistenceADTHasContractSerializationAndWriteRejections: /manifest_persistence_contract_rejected/.test(generator) && /manifest_persistence_serialization_rejected/.test(generator) && /manifest_persistence_write_rejected/.test(generator),
  scanExhaustivelyHandlesAllPersistenceArms: /manifest_persistence_contract_rejected/.test(scan) && /manifest_persistence_serialization_rejected/.test(scan) && /manifest_persistence_write_rejected/.test(scan) && /const exhaustive: never = persistenceJudgment/.test(scan),
  syncExhaustivelyHandlesAllPersistenceArms: /manifest_persistence_contract_rejected/.test(sync) && /manifest_persistence_serialization_rejected/.test(sync) && /manifest_persistence_write_rejected/.test(sync) && /const exhaustive: never = persistenceJudgment/.test(sync),
  standaloneScannerExhaustivelyHandlesContractAndPersistenceADTs: /manifest_contract_validated/.test(script) && /manifest_contract_rejected/.test(script) && /const exhaustive: never = contractJudgment/.test(script) && /manifest_persistence_contract_rejected/.test(script) && /manifest_persistence_serialization_rejected/.test(script) && /manifest_persistence_write_rejected/.test(script) && /const exhaustive: never = persistence/.test(script),
  serializerAndValidatorExposeTypedOperations: /export const manifestSerializationOperations:\s*ManifestSerializationOperationsInterface\s*=\s*Object\.freeze/.test(serializer) && /export const manifestContractValidationOperations:\s*ManifestContractValidationOperationsInterface\s*=\s*Object\.freeze/.test(validator),
};
for (const [name, passed] of Object.entries(checks)) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`Runtime files: ${files.length}; syntax diagnostics: ${syntaxDiagnostics}`);
console.log(`Phase 2758 explicit manifest runtime ADT audit: ${Object.values(checks).filter(Boolean).length}/${Object.keys(checks).length} checks passed`);
console.log('Static AST/source audit only; semantic typecheck, unit tests, build, and CLI E2E are separate verification steps.');
if (Object.values(checks).some(passed => !passed)) process.exit(1);
