const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const composition = fs.readFileSync(compositionPath, 'utf8');
const exportFrontierPath = path.join(root, 'reports/PHASE3101_REPOSITORY_EXPORT_MIGRATION_FRONTIER.json');
const exportFrontier = JSON.parse(fs.readFileSync(exportFrontierPath, 'utf8'));
const report = {
  phase: 3103,
  scope: 'replace the CLI filesystem directory-read generic handler/visitor boundary with concrete source-discovery domain operations',
  directoryReadSettlementUsesNamedDiscoveryOperation: /interface ControllerDirectoryReadSettlementOperations\s*\{[\s\S]*?readonly resolveDiscovery:/.test(composition),
  directoryReadSettlementHasNoGenericHandlers: !/interface ControllerDirectoryReadHandlers|ControllerDirectoryReadHandlers<Result>|continueWith: <Result>\(handlers: ControllerDirectoryReadHandlers/.test(composition),
  entriesVariantDelegatesToTypedDiscoveryOperation: /resolveDiscovery: \(operation, discoveryEvidence, sourceProject, root, directory\) => operation\.discover\(/.test(composition),
  blockedVariantPreservesOriginalDiscoveryResult: /resolveDiscovery: \(\) => Promise\.resolve\(evidence\.result\)/.test(composition),
  directoryEntryTraversalNamedAsOperationNotVisitor: /interface ControllerDirectoryEntriesOperationInterface/.test(composition) && /const controllerDirectoryEntriesOperation: ControllerDirectoryEntriesOperationInterface/.test(composition) && !/ControllerDirectoryEntriesVisitorInterface|controllerDirectoryEntriesVisitor/.test(composition),
  runtimeSettlementUsesNamedOperation: /directoryReadSettlement\.resolveDiscovery\(\s*controllerDirectoryEntriesOperation/.test(composition),
  noGenericDirectoryReadContinuationRemains: !/directoryReadSettlement\.continueWith|ControllerDirectoryReadSettlementOperations[\s\S]{0,240}continueWith/.test(composition),
  sourceDiscoveryBlockerAndPartialEvidenceFieldsRemain: /partialSources: discovered/.test(composition) && /blocker,/.test(composition),
  repositoryExportFrontierStillExplicitlyTracked: exportFrontier.totalNamedExportFunctionCandidates === exportFrontier.exportFunctionDeclarations + exportFrontier.exportedArrowVariableDeclarations + exportFrontier.exportedFunctionExpressionVariableDeclarations,
  currentExportFunctionDeclarations: exportFrontier.exportFunctionDeclarations,
  currentExportedArrowVariableDeclarations: exportFrontier.exportedArrowVariableDeclarations,
  currentTotalNamedExportFunctionCandidates: exportFrontier.totalNamedExportFunctionCandidates,
  currentGenericContinueWithArrowImplementations: exportFrontier.remainingGenericContinueWithArrowImplementations,
  repositoryWideExportConversionStatus: exportFrontier.conversionComplete === true ? 'complete' : 'incomplete',
  noDeletedRelationFoundationRestored: !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/relationMembership.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/relationalSequence.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/semanticRelations.ts')),
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
const unverified = new Set(['fullTypecheckVerified', 'fullTestSuiteVerified', 'phpToCliManifestGeneratorE2eVerified']);
const failed = Object.entries(report).filter(([key, value]) => typeof value === 'boolean' && !value && !unverified.has(key)).map(([key]) => key);
const output = path.join(root, 'reports/PHASE3103_DIRECTORY_READ_DOMAIN_OPERATION_AUDIT.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
