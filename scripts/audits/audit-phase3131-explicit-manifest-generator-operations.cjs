#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));

const validator = read('packages/cli/src/generators/ManifestContractValidator.ts');
const serializer = read('packages/cli/src/generators/ManifestSerializer.ts');
const generator = read('packages/cli/src/generators/ManifestGenerator.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const codegen = read('packages/cli/src/generators/manifestCodeGenerationOperation.ts');

const sourceRoots = ['packages/core/src', 'packages/cli/src', 'packages/sdk/src', 'packages/react/src'];
const sourceFiles = [];
const walk = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory() && !['node_modules', 'dist', '__tests__', '__test__'].includes(entry.name)) walk(full);
    if (entry.isFile() && /\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name)) sourceFiles.push(full);
  }
};
for (const relative of sourceRoots) walk(path.join(root, relative));

const inventory = sourceFiles.reduce((result, file) => {
  const source = fs.readFileSync(file, 'utf8');
  result.exportedFunctionDeclarations += (source.match(/\bexport\s+(?:default\s+)?(?:async\s+)?function\s+[A-Za-z_$][\w$]*\s*\(/g) || []).length;
  result.exportedArrowConstants += (source.match(/\bexport\s+const\s+[A-Za-z_$][\w$]*\s*(?::[^=;]+)?=\s*(?:async\s*)?(?:\([^;]*?\)|[A-Za-z_$][\w$]*)\s*=>/gs) || []).length;
  return result;
}, { exportedFunctionDeclarations: 0, exportedArrowConstants: 0 });

const checks = {
  phase: 3131,
  title: 'Explicit manifest validation, serialization, persistence and generator operations',
  validator: {
    validatedOwnsRequireOperation: /ManifestContractValidatedJudgment[\s\S]*?requireValidManifest: \(\) => RouteManifest/.test(validator),
    rejectedOwnsFailClosedOperation: /ManifestContractRejectedJudgment[\s\S]*?requireValidManifest: \(\) => never/.test(validator),
    noGenericVisitor: !/continueWith|ManifestContractValidationHandlers/.test(validator),
  },
  serializer: {
    completeOwnsRequireOperation: /ManifestSerializationCompleteJudgment[\s\S]*?requireSerializedManifest: \(\) => SerializableManifest/.test(serializer),
    rejectedOwnsFailClosedOperation: /ManifestSerializationRejectedJudgment[\s\S]*?requireSerializedManifest: \(\) => never/.test(serializer),
    noGenericVisitor: !/continueWith|ManifestSerializationHandlers/.test(serializer),
  },
  persistence: {
    completeOwnsRequireOperation: /ManifestPersistenceCompleteJudgment[\s\S]*?requireCompletePersistence: \(\) => ManifestPersistenceCompleteJudgment/.test(generator),
    rejectedOwnsFailClosedOperation: /ManifestPersistenceWriteRejectedJudgment[\s\S]*?requireCompletePersistence: \(\) => never/.test(generator),
    noGenericVisitor: !/continueWith|ManifestPersistenceHandlers/.test(generator),
  },
  runtimeTrace: {
    scanUsesValidationOperation: /manifestContractValidationOperations\.validate\(resolvedManifest\)\.requireValidManifest\(\)/.test(scan),
    syncUsesValidationOperation: /manifestContractValidationOperations\.validate\(resolvedManifest\)\.requireValidManifest\(\)/.test(sync),
    scanUsesPersistenceOperation: /persistenceJudgment\.requireCompletePersistence\(\)/.test(scan),
    syncUsesPersistenceOperation: /persistenceJudgment\.requireCompletePersistence\(\)/.test(sync),
    generatorRemainsExplicitlyTyped: /export interface ManifestCodeGenerationOperationInterface/.test(codegen) && /requireCompleteGeneration/.test(codegen),
    noActiveManifestVisitor: !/\.continueWith\(/.test(`${scan}\n${sync}\n${generator}`),
  },
  invariants: {
    noDeletedRelationFoundationRestored: ![
      'packages/core/src/semantic/relations/relationMembership.ts',
      'packages/core/src/semantic/relations/relationalSequence.ts',
      'packages/core/src/semantic/relations/semanticRelations.ts',
    ].some(exists),
  },
  migrationFrontier: {
    inventory,
    repositoryWideExportConversion: false,
    primitiveAndControlFlowErasure: false,
    fullTypecheckVerified: false,
    fullTestSuiteVerified: false,
    phpToCliManifestGeneratorE2eVerified: false,
  },
};

const required = [
  checks.validator.validatedOwnsRequireOperation,
  checks.validator.rejectedOwnsFailClosedOperation,
  checks.validator.noGenericVisitor,
  checks.serializer.completeOwnsRequireOperation,
  checks.serializer.rejectedOwnsFailClosedOperation,
  checks.serializer.noGenericVisitor,
  checks.persistence.completeOwnsRequireOperation,
  checks.persistence.rejectedOwnsFailClosedOperation,
  checks.persistence.noGenericVisitor,
  checks.runtimeTrace.scanUsesValidationOperation,
  checks.runtimeTrace.syncUsesValidationOperation,
  checks.runtimeTrace.scanUsesPersistenceOperation,
  checks.runtimeTrace.syncUsesPersistenceOperation,
  checks.runtimeTrace.generatorRemainsExplicitlyTyped,
  checks.runtimeTrace.noActiveManifestVisitor,
  checks.invariants.noDeletedRelationFoundationRestored,
];

const reportPath = path.join(root, 'reports/PHASE3131_EXPLICIT_MANIFEST_GENERATOR_OPERATIONS_AUDIT.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(checks, null, 2)}\n`);
const failed = required.filter(value => !value).length;
console.log(JSON.stringify({ report: path.relative(root, reportPath), checks, failed }, null, 2));
if (failed) process.exitCode = 1;
