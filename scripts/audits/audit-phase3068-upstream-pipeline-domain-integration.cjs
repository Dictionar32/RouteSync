const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipelineInterface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineInterface.ts');
const pipelineAuthority = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts');
const integrationInterface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const pipelineTerminalOperations = pipelineInterface.match(/export interface PhpSourceInvocationSemanticPipelineTerminalOperations \{[\s\S]*?\n\}/)?.[0] ?? '';
const sourceBindingAuthority = read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingAuthority.ts');
const sourceBindingInterface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticSourceBindingInterface.ts');
const invocationAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationsDir = path.join(root, 'packages/core/src/semantic/relations');
const checks = {
  producerContractOwnsDomainIntegrationOperation: /interface PhpSourceInvocationSemanticPipelineTerminalOperations[\s\S]*?integrateWithControllerSourceBinding/.test(pipelineInterface),
  producerNoLongerExposesGenericResultHandlers: !/\bPhpSourceInvocationSemanticPipelineHandlers\b/.test(pipelineInterface) && !/continueWith/.test(pipelineTerminalOperations),
  producerAuthorityInstallsOperationOnBlockedOutcome: /const blocked =[\s\S]*?integrateWithControllerSourceBinding: \(sourceBinding: ClosedControllerSourceBinding\): IntegratedPipelineOutcome => integrateBlockedPipeline\(sourceBinding, judgment\)/.test(pipelineAuthority),
  producerAuthorityInstallsOperationOnCompleteOutcome: /const completed =[\s\S]*?integrateWithControllerSourceBinding: \(sourceBinding: ClosedControllerSourceBinding\): IntegratedPipelineOutcome => integrateCompletePipeline\(sourceBinding, judgment\)/.test(pipelineAuthority),
  sourceBindingAdtOwnsCompositionProjection: /interface PhpSourceInvocationSemanticSourceBindingTerminalOperations[\s\S]*?toPipelineCompositionEvidence/.test(sourceBindingInterface) && !/PhpSourceInvocationSemanticSourceBindingHandlers|readonly continueWith: <Result>/.test(sourceBindingInterface),
  sourceBindingAuthorityUsesItsDomainOperation: /judgment\.toPipelineCompositionEvidence\(\)/.test(sourceBindingAuthority) && !/judgment\.continueWith/.test(sourceBindingAuthority),
  compositionEvidenceAdtOwnsIntegrationOperation: /interface PhpSourceInvocationSemanticPipelineCompositionEvidenceOperations[\s\S]*?toControllerInvocationIntegrationResult/.test(pipelineInterface) && !/PhpSourceInvocationSemanticPipelineCompositionEvidenceHandlers/.test(pipelineInterface),
  notConnectedEvidenceOwnsIntegrationOperation: /toControllerInvocationIntegrationResult: \(\) => phpSourceInvocationSemanticPipelineIntegrationOutcomeFactory\.notConnected\(evidence\)/.test(invocationAuthority),
  connectedAndRejectedEvidenceOwnIntegrationOperation: /toControllerInvocationIntegrationResult: \(\) => phpSourceInvocationSemanticPipelineIntegrationOutcomeFactory\.connected\(evidence\)/.test(sourceBindingAuthority) && /toControllerInvocationIntegrationResult: \(\) => phpSourceInvocationSemanticPipelineIntegrationOutcomeFactory\.sourceBindingRejected\(judgment\)/.test(sourceBindingAuthority),
  integrationOutcomeFactoryIsExplicitlyTyped: /export const phpSourceInvocationSemanticPipelineIntegrationOutcomeFactory: PhpSourceInvocationSemanticPipelineIntegrationOutcomeFactoryInterface = Object\.freeze/.test(integration),
  completeIntegrationRetainsExactPipelineAndBatch: /kind: 'php_source_invocation_integration_complete',[\s\S]*?sourceBinding,[\s\S]*?pipeline,[\s\S]*?batch: pipeline\.batch/.test(pipelineAuthority),
  blockedIntegrationRetainsExactPipelineAndSourceBinding: /kind: 'php_source_invocation_integration_blocked',[\s\S]*?sourceBinding,[\s\S]*?pipeline,/.test(pipelineAuthority),
  consumerCallsProducerDomainOperation: /pipelineResult\.integrateWithControllerSourceBinding\(evidence\.sourceBinding\)/.test(integration),
  integrationAuthorityDelegatesToEvidenceDomainOperation: /return evidence\.toControllerInvocationIntegrationResult\(\)/.test(integration),
  consumerNoLongerDispatchesPipelineResultHandlers: !/pipelineResult\.continueWith|onComplete: pipeline => completeResult|onBlocked: pipeline => blockedResult/.test(integration),
  completionAndBlockageRemainSeparate: /php_source_invocation_integration_complete/.test(pipelineAuthority) && /php_source_invocation_integration_blocked/.test(pipelineAuthority),
  sourceBindingKeepsExactPipelineResult: /pipelineResult: input\.pipelineResult/.test(sourceBindingAuthority),
  contractVersionBumpedForOperationChange: /version: 4/.test(pipelineInterface) && /integrateWithControllerSourceBinding/.test(pipelineInterface),
  manifestBuilderBlockedProjectionStillExists: /kind: 'manifest_builder_blocked'[\s\S]*?projection: blockedProjection/.test(read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts')),
  cliScanBlockedGatePrecedesOutputWrites: (() => { const source = read('packages/cli/src/commands/scan.ts'); const gate = source.indexOf('const completeManifest = scannedManifest.continueForDriftAudit'); const writes = Math.min(...['writeFileSync(', 'writeJson(', 'manifestGeneratorOperations.save('].map(token => { const i = source.indexOf(token); return i < 0 ? Number.POSITIVE_INFINITY : i; })); return gate >= 0 && gate < writes && /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(source); })(),
  cliSyncBlockedGatePrecedesOutputWrites: (() => { const source = read('packages/cli/src/commands/sync.ts'); const gate = source.indexOf('const completeManifest = scannedManifest.continueForDriftAudit'); const writes = Math.min(...['writeFileSync(', 'writeJson(', 'manifestGeneratorOperations.save('].map(token => { const i = source.indexOf(token); return i < 0 ? Number.POSITIVE_INFINITY : i; })); return gate >= 0 && gate < writes && /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(source); })(),
  deletedRelationFoundationRemainsAbsent: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationsDir, name))),
  protectedCollectionsInvariantOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const regression3067 = spawnSync(process.execPath, [path.join(root, 'scripts/audits/audit-phase3067-schema-evidence-domain-operations.cjs')], { cwd: root, encoding: 'utf8' });
const regression3062 = spawnSync(process.execPath, [path.join(root, 'scripts/audits/audit-phase3062-controller-body-blocker-to-manifest.cjs')], { cwd: root, encoding: 'utf8' });
const result = {
  phase: 3068,
  title: 'Fully Explicit Typed Runtime Scanner Operations — move pipeline continuation into upstream domain operation',
  status: failed.length === 0 && regression3067.status === 0 && regression3062.status === 0 ? 'PASS' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  regressions: {
    phase3067SchemaEvidenceDomainOperations: regression3067.status === 0 ? 'PASS' : 'FAIL',
    phase3062BlockerToManifest: regression3062.status === 0 ? 'PASS' : 'FAIL',
  },
  runtimeTrace: [
    'PHP source document → whole-file frontend validation → source inventory → name-resolution judgments → closed invocation batch',
    'PhpSourceInvocationSemanticPipelineResult (complete | blocked) owns integrateWithControllerSourceBinding(sourceBinding)',
    'The producer outcome constructs the corresponding typed integration result; consumer no longer supplies generic complete/blocked callbacks',
    'Source-binding identity judgment projects to connected/rejected composition evidence through a domain operation',
    'Composition evidence owns its typed transition to the final controller invocation integration result',
    'Source-binding identity judgment and exact pipeline payload remain attached to the integrated result',
    'Controller invocation judgment → Laravel controller scanner → source AST pipeline → manifest builder complete/blocked',
    'CLI scan/sync blocked gate remains before manifest/IR output writes',
  ],
  verification: {
    structuralAudit: failed.length === 0 ? 'PASS' : 'FAIL',
    phase3067Regression: regression3067.status === 0 ? 'PASS' : 'FAIL',
    phase3062ManifestBlockerRegression: regression3062.status === 0 ? 'PASS' : 'FAIL',
    strictTypeScript: 'BLOCKED_BY_PREEXISTING_REPOSITORY_ERRORS_AND_MISSING_TYPE_PACKAGES',
    vitestRuntime: 'NOT_RUN — Vitest dependency is incomplete in the workspace',
    endToEndPhpCliManifestFixture: 'NOT_RUN',
    globalGenericOrPrimitiveElimination: 'NOT_CLAIMED',
  },
  remainingRisks: [
    'This phase removes generic continuation from the whole-file PHP source invocation pipeline result, not from every upstream ADT.',
    'The source-file identity relation judgment still exposes a generic continuation API; that is the next upstream ADT frontier for this runtime path.',
    'The strict TypeScript command is blocked by the protected one-byte collections.ts invariant, deleted relation-foundation imports, and incomplete ambient type packages.',
    'The full PHP → CLI → manifest/IR path has not been executed as an end-to-end fixture.',
  ],
};
for (const [name, pass] of Object.entries(checks)) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${result.passed}/${result.total} checks passed`);
console.log(`Phase 3067 regression: ${result.regressions.phase3067SchemaEvidenceDomainOperations}`);
console.log(`Phase 3062 regression: ${result.regressions.phase3062BlockerToManifest}`);
fs.writeFileSync(path.join(root, 'PHASE3068_UPSTREAM_PIPELINE_DOMAIN_INTEGRATION_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
if (result.status !== 'PASS') process.exit(1);
