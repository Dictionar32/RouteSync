const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const coreBarrel = read('packages/core/src/index.ts');
const cliBarrel = read('packages/cli/src/index.ts');
const generatorBarrel = read('packages/cli/src/generators/index.ts');
const manifestTypes = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const generator = read('packages/cli/src/generators/ManifestGenerator.ts');
const serializer = read('packages/cli/src/generators/ManifestSerializer.ts');
const validator = read('packages/cli/src/generators/ManifestContractValidator.ts');
const checks = [
  ['core barrel exports complete manifest-builder blocker ADT', /ManifestBuilderBlocker, ManifestBuilderSourceAstBlocker, ManifestBuilderSourceModelBlocker/.test(coreBarrel)],
  ['core barrel exports both terminal blocker judgments', /ManifestBuilderSourceAstBlockedJudgment, ManifestBuilderSourceModelBlockedJudgment/.test(coreBarrel)],
  ['canonical manifest builder ADT preserves separate AST/model discriminators', /kind: 'manifest_builder_source_ast_blocked'/.test(manifestTypes) && /kind: 'manifest_builder_source_model_blocked'/.test(manifestTypes)],
  ['CLI generator barrel exports validation operation and judgment', /manifestContractValidationOperations/.test(generatorBarrel) && /ManifestContractValidationJudgment/.test(generatorBarrel) && /ManifestContractViolation/.test(generatorBarrel)],
  ['CLI generator barrel exports serialization operation and ADT', /manifestSerializationOperations/.test(generatorBarrel) && /ManifestSerializationJudgment/.test(generatorBarrel) && /SerializableManifest/.test(generatorBarrel)],
  ['CLI generator barrel exports generation and persistence ADTs', /manifestGeneratorOperations/.test(generatorBarrel) && /ManifestGenerationJudgment/.test(generatorBarrel) && /ManifestPersistenceJudgment/.test(generatorBarrel)],
  ['CLI package entrypoint re-exports manifest runtime values', /manifestContractValidationOperations/.test(cliBarrel) && /manifestSerializationOperations/.test(cliBarrel) && /manifestGeneratorOperations/.test(cliBarrel)],
  ['CLI package entrypoint re-exports public ADT contracts', /ManifestContractValidationJudgment/.test(cliBarrel) && /ManifestSerializationJudgment/.test(cliBarrel) && /ManifestPersistenceJudgment/.test(cliBarrel)],
  ['persistence branches exhaustively handle validation and serialization ADTs', /const exhaustive: never = validation/.test(generator) && /const exhaustive: never = serialization/.test(generator)],
  ['validation and serialization return explicit discriminated judgments', /manifest_contract_validated/.test(validator) && /manifest_contract_rejected/.test(validator) && /manifest_serialization_complete/.test(serializer) && /manifest_serialization_rejected/.test(serializer)],
  ['Phase 2760 documentation exists', fs.existsSync(path.join(root, 'PHASE2760_PUBLIC_BARREL_EXPLICIT_ADT_RUNTIME.md'))],
];
let failed = 0;
for (const [label, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
console.log(`Phase 2760 public barrel / explicit ADT runtime audit: ${checks.length - failed}/${checks.length}`);
if (failed) process.exitCode = 1;
