#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const coreReader = read('packages/core/src/compiler/scanner/wiring/phpSourceDocumentReader.ts');
const upstreamDiscovery = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const cliComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const coreIndex = read('packages/core/src/index.ts');
const tests = read('packages/core/src/types/upstream/__tests__/filesystem-failure-adt.phase2917.test.ts');
const discoveryTests = read('packages/core/src/types/upstream/__tests__/laravel-controller-source-discovery-complete-operation.phase3104.test.ts');
const checks = {
  phase: 3108,
  scope: 'single shared Node filesystem failure observation plus upstream-owned blocked-discovery settlement on the runtime path',
  sharedObservationHasNamedInterface: /export interface NodeFilesystemFailureObservationInterface/.test(coreReader),
  sharedObservationRetainsFailureCodeNameAndMessage: /failureCode: FilesystemFailureCode/.test(coreReader) && /failureName: StringValue/.test(coreReader) && /failureMessage: StringValue/.test(coreReader),
  observationAcceptsUnknownPlatformRejectionAtBoundary: /observe: \(thrownValue: unknown\)/.test(coreReader),
  coreSourceReaderUsesSharedObservation: /nodeFilesystemFailureObservation\.observe\(failure\)\.failureCode\.createSourceReadBlocker/.test(coreReader),
  cliLocalDuplicateObservationRemoved: !/const nodeFilesystemFailureObservation: NodeFilesystemFailureObservationInterface/.test(cliComposition),
  cliImportsSharedObservation: /nodeFilesystemFailureObservation } from '@routesync\/core'/.test(cliComposition),
  sharedObservationExportedFromCore: /export \{ phpSourceDocumentReader, nodeFilesystemFailureObservation \}/.test(coreIndex),
  upstreamDiscoveryFactoryOwnsFilesystemFailureSettlement: /readonly blockedByFilesystemFailure: \(\s*input: LaravelControllerSourceDiscoveryFilesystemFailureInput,/.test(upstreamDiscovery) && /input\.failureCode\.createDiscoveryBlocker/.test(upstreamDiscovery),
  cliDelegatesBlockedJudgmentConstructionToUpstream: /laravelControllerSourceDiscoveryJudgmentFactory\.blockedByFilesystemFailure\(/.test(cliComposition) && !/const filesystemFailureOperation/.test(cliComposition),
  regressionTestsCoverErrorAndNonErrorRejections: /shares one typed Node failure observation/.test(tests) && /non-Error value/.test(tests),
  regressionTestCoversUpstreamFailureSettlementAndEvidencePreservation: /blockedByFilesystemFailure/.test(discoveryTests) && /partialSources/.test(discoveryTests) && /toHaveProperty\('failure', failure\)/.test(discoveryTests),
  deletedRelationFoundationNotReferenced: !/semantic\/relations\/(relationMembership|relationalSequence|semanticRelations)/.test(coreReader + cliComposition),
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
const failed = Object.entries(checks).filter(([key, value]) => key !== 'phase' && key !== 'scope' && key.endsWith('Verified') === false && value === false).map(([key]) => key);
const reportPath = path.join(root, 'reports/PHASE3108_SHARED_FILESYSTEM_FAILURE_OBSERVATION_AUDIT.json');
fs.writeFileSync(reportPath, JSON.stringify(checks, null, 2) + '\n');
console.log(JSON.stringify(checks, null, 2));
if (failed.length) process.exitCode = 1;
