#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const upstream = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const filesystem = read('packages/core/src/types/upstream/filesystemFailureInterface.ts');
const cli = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const tests = read('packages/core/src/types/upstream/__tests__/laravel-controller-source-discovery-blocker.phase2915.test.ts');
const checks = {
  phase: 3109,
  scope: 'replace generic discovery-blocker continuation with a fixed upstream-owned blocked-judgment operation',
  blockerHasFixedDomainOperation: /readonly blockDiscovery:\s*\(\s*input: LaravelControllerSourceDiscoveryBlockerSettlementInput/.test(upstream),
  genericBlockerHandlersRemoved: !/LaravelControllerSourceDiscoveryBlockerHandlers/.test(upstream),
  genericBlockerContinuationRemoved: !/readonly continueWith: <Result>\(handlers: LaravelControllerSourceDiscoveryBlockerHandlers<Result>\)/.test(upstream),
  filesystemFailureSettlementUsesBlockerOperation: /\.blockDiscovery\(Object\.freeze\(\{\s*sourceProject: input\.sourceProject,\s*root: input\.root,\s*partialSources: input\.partialSources/.test(upstream),
  blockerObjectIsPreservedInJudgment: /blocker,\s*\}\)\)/.test(upstream),
  filesystemClassifierStillOwnsFailureToBlockerMapping: /createDiscoveryBlocker:/.test(filesystem) && /input\.failureCode\.createDiscoveryBlocker/.test(upstream),
  runtimeCliStillUsesUpstreamFailureSettlement: /laravelControllerSourceDiscoveryJudgmentFactory\.blockedByFilesystemFailure\(/.test(cli),
  regressionTestsCoverAllBlockerKinds: ['rootMissing', 'directoryMissing', 'pathNotDirectory', 'directoryUnreadable', 'symbolicLinkEncountered', 'failureCodeUnrecognized'].every(name => tests.includes(`laravelControllerSourceDiscoveryBlockerFactory.${name}`)),
  regressionTestsAssertEvidencePreservation: /toBe\(blocker\)/.test(tests) && /partialSources/.test(tests) && /originalFailure/.test(tests),
  noDeletedRelationFoundationRestored: !/semantic\/relations\/(relationMembership|relationalSequence|semanticRelations)/.test(upstream + filesystem + cli),
  fullTypecheckVerified: false,
  fullTestSuiteVerified: false,
  phpToCliManifestGeneratorE2eVerified: false,
};
const failed = Object.entries(checks).filter(([key, value]) => key !== 'phase' && key !== 'scope' && !key.endsWith('Verified') && value === false).map(([key]) => key);
const report = path.join(root, 'reports/PHASE3109_UPSTREAM_BLOCKER_DOMAIN_SETTLEMENT_AUDIT.json');
fs.writeFileSync(report, JSON.stringify(checks, null, 2) + '\n');
console.log(JSON.stringify(checks, null, 2));
if (failed.length) process.exitCode = 1;
