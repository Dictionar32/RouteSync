const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const interfacePath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const scanPath = path.join(root, 'packages/cli/src/commands/scan.ts');
const syncPath = path.join(root, 'packages/cli/src/commands/sync.ts');
const driftPath = path.join(root, 'packages/cli/src/commands/audit/driftAuditor.ts');
const source = fs.readFileSync(interfacePath, 'utf8');
const composition = fs.readFileSync(compositionPath, 'utf8');
const consumers = [scanPath, syncPath, driftPath].map(file => fs.readFileSync(file, 'utf8'));

const report = {
  phase: 3099,
  scope: 'fixed typed result contract for CLI manifest terminal operation',
  terminalHandlerResultGenericRemoved: !/ControllerInvocationManifestDriftAuditHandlersInterface\s*<\s*Result\s*=\s*void\s*>/.test(source),
  terminalOperationResultGenericRemoved: !/continueForDriftAudit\s*:\s*<\s*Result\s*>/.test(source),
  successfulTerminalReturnTypeExplicit: /continueForDriftAudit\s*:\s*\(handlers:\s*ControllerInvocationManifestDriftAuditHandlersInterface\)\s*=>\s*Extract<ManifestBuilderJudgment, \{ readonly kind: 'manifest_builder_complete' \}>\['manifest'\]/.test(source),
  successfulHandlerReturnTypeExplicit: source.includes("readonly complete: (judgment: Extract<ManifestBuilderJudgment, { readonly kind: 'manifest_builder_complete' }>) => Extract<ManifestBuilderJudgment, { readonly kind: 'manifest_builder_complete' }>['manifest'];"),
  namedTerminalHandlersRetained: ['manifestBlocked', 'inventoryRejected', 'sourceDiscoveryBlocked', 'sourceProjectIdentityBlocked', 'sourceDocumentsBlocked', 'sourceDocumentIdentityRejected', 'sourceDocumentReadOperationRejected'].every(name => source.includes(`readonly ${name}:`)),
  terminalFactoryStillBindsDomainHandlers: composition.includes('continueForDriftAudit: handlers => handlers.complete(judgment)') && composition.includes('continueForDriftAudit: handlers => handlers.sourceDocumentReadOperationRejected(judgment)'),
  scanSyncAndDriftConsumersRemainOnTypedOperation: consumers.every(text => text.includes('.continueForDriftAudit({')),
  sourceEvidenceAndBlockedHandlerShapesRetained: /sourceDocumentsBlocked: \(judgment: ControllerInvocationManifestSourceDocumentsBlockedJudgment\) => never/.test(source) && /sourceDocumentReadOperationRejected: \(judgment: ControllerInvocationManifestSourceDocumentReadOperationRejectedJudgment\) => never/.test(source),
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};

const verificationFields = new Set(['fullTypecheckVerified', 'fullTestSuiteVerified', 'phpToCliManifestGeneratorE2eVerified']);
const failed = Object.entries(report).filter(([key, value]) => typeof value === 'boolean' && !value && !verificationFields.has(key)).map(([key]) => key);
const output = path.join(root, 'reports/PHASE3099_FIXED_TERMINAL_MANIFEST_CONTRACT_AUDIT.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
