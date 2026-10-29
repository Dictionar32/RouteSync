const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const report = JSON.parse(read('PHASE3088_FULLY_EXPLICIT_RUNTIME_SCANNER_MIGRATION_AUDIT.json'));
const cliOperation = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const sourceRead = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const sourceIdentity = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const inventory = JSON.parse(read('PHASE3086_REPOSITORY_WIDE_EXPORT_INTERFACE_MIGRATION_INVENTORY.json'));
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relations = path.join(root, 'packages/core/src/semantic/relations');
const checks = {
  scanSyncRuntimeOperationExists: /RouteSyncCliManifestScanOperationInterface/.test(cliOperation),
  scanOperationDelegatesToComposition: /authority\.compose\(input\)/.test(cliOperation),
  compositionRunsProjectCanonicalizationBeforeDiscovery: /continueToCanonicalization/.test(composition) && /sourceDiscovery\.discover/.test(composition),
  sourceReadBatchHasDomainOwnedAccumulation: /phpSourceDocumentReadOperationBatchFactory/.test(composition) && /contributeToBatch/.test(sourceRead),
  genericSourceReadContinuationExplicitlyRecordedAsOpen: /continueWith:\s*<Result>/.test(sourceRead) && report.openFrontiers.some(frontier => frontier.owner.includes('phpSourceFrontendInterface.ts')),
  canonicalizationContinuationExplicitlyRecordedAsOpen: /continueToCanonicalization/.test(composition) && /continueToCanonicalization/.test(sourceIdentity + read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts')) && report.openFrontiers.some(frontier => frontier.owner.includes('sourceProjectIdentity.ts')),
  repositoryExportInventoryMatchesRecordedFrontier: inventory.remainingCandidates === report.migrationInventory.remainingCandidates && inventory.totals.exportFunction === report.migrationInventory.exportFunction && inventory.totals.exportedArrowConst === report.migrationInventory.exportArrowConst,
  deletedRelationFoundationRemainsAbsent: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relations, name))),
  protectedCollectionsInvariantOneNewlineByte: collections.length === 1 && collections[0] === 10,
  reportDoesNotClaimWholeWorkspaceVerification: report.verification.wholeWorkspaceStrictTypeScript.startsWith('NOT RUN') && report.verification.fullTestSuite === 'NOT RUN' && report.verification.phpCliManifestGeneratorEndToEnd === 'NOT RUN',
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
console.log(JSON.stringify({ phase: 3088, status: failed.length ? 'FAIL' : 'PASS_WITH_MIGRATION_OPEN', passed: Object.keys(checks).length - failed.length, total: Object.keys(checks).length, checks }, null, 2));
if (failed.length) process.exitCode = 1;
