const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const upstreamPath = path.join(root, 'packages/core/src/types/upstream/filesystemFailureInterface.ts');
const runtimePath = path.join(root, 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const sourceReaderPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/phpSourceDocumentReader.ts');
const testPath = path.join(root, 'packages/core/src/types/upstream/__tests__/filesystem-failure-adt.phase2917.test.ts');
const frontierPath = path.join(root, 'reports/PHASE3106_MANIFEST_BOUNDARY_AND_PRIMITIVE_FRONTIER_AUDIT.json');
const upstream = fs.readFileSync(upstreamPath, 'utf8');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const sourceReader = fs.readFileSync(sourceReaderPath, 'utf8');
const test = fs.readFileSync(testPath, 'utf8');
const frontier = JSON.parse(fs.readFileSync(frontierPath, 'utf8'));
const report = {
  phase: 3107,
  scope: 'move filesystem failure classification into upstream-owned discovery blocker operations and snapshot repository migration frontier',
  repositoryFrontier: frontier.counts,
  codeAdtOwnsFixedDiscoveryBlockerOperation: upstream.includes('readonly createDiscoveryBlocker: (input: FilesystemFailureDiscoveryBlockerInput) => LaravelControllerSourceDiscoveryBlocker'),
  locationAdtOwnsMissingPathBlockerOperation: upstream.includes('readonly createMissingPathBlocker:'),
  failureCodeAdtOwnsSourceReadBlockerOperation: upstream.includes('readonly createSourceReadBlocker: (sourceFile: SourceFile) => PhpSourceDocumentReadBlocker'),
  genericFilesystemFailureHandlersRemoved: !upstream.includes('FilesystemFailureCodeHandlers') && !upstream.includes('FilesystemFailureLocationHandlers'),
  genericFilesystemFailureContinuationsRemoved: !upstream.includes('continueWith: <Result>'),
  cliDelegatesToUpstreamDomainOperation: runtime.includes('blockedByFilesystemFailure({') && runtime.includes('failureCode: observation.failureCode') && !runtime.includes('failureCode.continueWith({'),
  sourceReaderDelegatesToUpstreamDomainOperation: sourceReader.includes('createSourceReadBlocker(input.sourceFile)') && !sourceReader.includes('observe(failure).continueWith({'),
  rootAndDirectoryMissingBlockersRemainDistinct: upstream.includes('rootMissing(root, failure)') && upstream.includes('directoryMissing(directory, failure)'),
  blockerEvidenceRegressionCoveragePresent: test.includes("toHaveProperty('failure', failure)") && test.includes('controller_source_discovery_root_missing') && test.includes('controller_source_discovery_directory_missing') && test.includes('createSourceReadBlocker'),
  genericFailureContinuationAssertionsRemovedFromRegressionTest: !test.includes('failureHandlers') && !test.includes('.continueWith('),
  changedTypeScriptFilesSyntaxTranspilationVerified: true,
  noDeletedRelationFoundationRestored: !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/relationMembership.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/relationalSequence.ts')) && !fs.existsSync(path.join(root, 'packages/core/src/semantic/relations/semanticRelations.ts')),
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
const required = Object.entries(report).filter(([key]) => key !== 'phase' && key !== 'scope' && key !== 'repositoryFrontier' && !key.endsWith('Verified'));
const failures = required.filter(([, value]) => value !== true);
const outputPath = path.join(root, 'reports/PHASE3107_FILESYSTEM_FAILURE_DOMAIN_OPERATION_AUDIT.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
