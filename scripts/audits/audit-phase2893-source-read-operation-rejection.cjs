const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const contract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const commandFiles = [
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/commands/sync.ts',
  'packages/cli/src/commands/audit/driftAuditor.ts',
];
const checks = [
  ['source reads use all-settled domain outcomes', composition.includes('Promise.all(discoveredSources.map(async requestedSourceFile => {') && composition.includes('php_source_document_read_operation_rejected')],
  ['rejected read operations become a distinct terminal ADT', contract.includes('ControllerInvocationManifestSourceDocumentReadOperationRejectedJudgment') && composition.includes('sourceDocumentReadOperationRejected(Object.freeze(')],
  ['rejected operation records affected source files', contract.includes('readonly sourceFiles: readonly SourceFile[]')],
  ['terminal ADT owns continuation', composition.includes('handlers.sourceDocumentReadOperationRejected(judgment)')],
  ['scan handles rejected source-reader operations', read(commandFiles[0]).includes('sourceDocumentReadOperationRejected: judgment =>')],
  ['sync handles rejected source-reader operations', read(commandFiles[1]).includes('sourceDocumentReadOperationRejected: judgment =>')],
  ['drift audit handles rejected source-reader operations', read(commandFiles[2]).includes('sourceDocumentReadOperationRejected: judgment =>')],
  ['collections.ts remains empty', fs.statSync(path.join(root, 'packages/core/src/types/upstream/collections.ts')).size === 0],
  ['composition has no exported function declarations', !/^\s*export\s+function\s/m.test(composition)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
