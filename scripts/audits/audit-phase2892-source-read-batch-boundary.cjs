const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const compositionPath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const compositionInterfacePath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const discoveryPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const collectionsPath = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const composition = fs.readFileSync(compositionPath, 'utf8');
const compositionInterface = fs.readFileSync(compositionInterfacePath, 'utf8');
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const discovery = fs.readFileSync(discoveryPath, 'utf8');
const checks = {
  compositionUsesExistingReadBatchFactory: /phpSourceDocumentReadBatchFactory\.fromResults\(boundBatch\.readResults\)\.continueWith\(/.test(composition),
  batchCompleteAndBlockedVariantsAreExplicit: /interface PhpSourceDocumentReadBatchCompleteEvidence/.test(upstream) && /interface PhpSourceDocumentReadBatchBlockedEvidence/.test(upstream),
  batchJudgmentOwnsContinuation: /type PhpSourceDocumentReadBatchJudgment\s*=/.test(upstream) && /interface PhpSourceDocumentReadBatchOperations\s*\{[\s\S]*?continueWith/.test(upstream),
  batchFactoryUsesInterfaceFirstRuntimeExport: /export const phpSourceDocumentReadBatchFactory:\s*PhpSourceDocumentReadBatchFactoryInterface\s*=\s*Object\.freeze\(/.test(upstream),
  unexpectedPromiseRejectionCanEscapeBatchBoundary: /await Promise\.all\(discoveredSources\.map\(async requestedSourceFile/.test(composition),
  discoveryContractAlreadyExists: /interface LaravelControllerSourceDiscoveryInterface/.test(discovery) && /type LaravelControllerSourceDiscoveryResult/.test(discovery),
  compositionHasTypedReaderDependency: /readonly sourceDocumentReader:\s*PhpSourceDocumentReaderInterface/.test(compositionInterface),
  compositionHasNoExportFunction: !/^\s*export\s+function\s+/m.test(composition),
  upstreamCollectionsRemainEmpty: fs.existsSync(collectionsPath) && fs.statSync(collectionsPath).size === 0,
};
const findings = [
  'An unexpected rejected promise from sourceDocumentReader.read can escape Promise.all before the source-read batch ADT receives results. This is a risk to verify/fix, not a proven production failure.',
  'Do not coerce unexpected operation failures into ordinary filesystem blocked evidence; keep the failure domain distinct.',
  'Reuse PhpSourceDocumentReadBatchJudgment and phpSourceDocumentReadBatchFactory; no duplicate batch contract is needed.',
  'No runtime source was modified in this audit-only phase. Typecheck, build, unit tests, and CLI E2E were not run.'
];
const report = { phase: 2892, title: 'Source Read Batch Boundary Audit', checks, passed: Object.values(checks).filter(Boolean).length, total: Object.keys(checks).length, findings, typecheckBuildTestsE2e: 'not-run' };
const reportPath = path.join(root, 'packages/cli/src/parsers/php/docs/PHASE2892_SOURCE_READ_BATCH_BOUNDARY_AUDIT.json');
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;
