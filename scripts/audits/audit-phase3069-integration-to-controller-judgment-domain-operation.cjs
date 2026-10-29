const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const integrationInterface = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts');
const integration = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts');
const pipelineAuthority = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts');
const invocationAuthority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const sourceIdentity = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationsDir = path.join(root, 'packages/core/src/semantic/relations');
const changedFiles = [
  'packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegrationInterface.ts',
  'packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineIntegration.ts',
  'packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts',
  'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts',
];
const syntaxDiagnostics = changedFiles.flatMap(relative => {
  const fileName = path.join(root, relative);
  const source = fs.readFileSync(fileName, 'utf8');
  const output = ts.transpileModule(source, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
  });
  return (output.diagnostics ?? []).map(diagnostic => ({ file: relative, code: diagnostic.code, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n') }));
});
const checks = {
  genericIntegrationHandlerContractRemoved: !/PhpSourceInvocationSemanticPipelineIntegrationHandlers|readonly continueWith:\s*<Result>/.test(integrationInterface),
  integrationOutcomesOwnExplicitControllerJudgmentOperation: /interface PhpSourceInvocationSemanticPipelineIntegrationNotConnectedOperations[\s\S]*?toControllerInvocationSemanticJudgment/.test(integrationInterface),
  operationHasDomainSpecificReturnType: /toControllerInvocationSemanticJudgment:[\s\S]*?LaravelControllerInvocationSemanticJudgmentInterface/.test(integrationInterface),
  integrationContractVersionBumped: /version: 13/.test(integrationInterface),
  contractNamesDomainOperation: /all-four-integrated-outcomes-own-toControllerInvocationSemanticJudgment/.test(integrationInterface),
  notConnectedOutcomeInstallsOperation: /kind: 'php_source_invocation_integration_not_connected',[\s\S]*?toControllerInvocationSemanticJudgment:[\s\S]*?phpSourceInvocationSemanticPipelineIntegrationJudgmentOperations\.notConnected\(sourceFile, result\)/.test(integration),
  sourceBindingRejectedOutcomeInstallsOperation: /kind: 'php_source_invocation_integration_source_binding_rejected',[\s\S]*?toControllerInvocationSemanticJudgment:[\s\S]*?phpSourceInvocationSemanticPipelineIntegrationJudgmentOperations\.sourceBindingRejected\(sourceFile, result\)/.test(integration),
  completeOutcomeInstallsOperation: /kind: 'php_source_invocation_integration_complete',[\s\S]*?toControllerInvocationSemanticJudgment: \(sourceFile: SourceFile\) => phpSourceInvocationSemanticPipelineIntegrationJudgmentOperations\.complete\(sourceFile, result\)/.test(pipelineAuthority),
  blockedOutcomeInstallsOperation: /kind: 'php_source_invocation_integration_blocked',[\s\S]*?toControllerInvocationSemanticJudgment: \(sourceFile: SourceFile\) => phpSourceInvocationSemanticPipelineIntegrationJudgmentOperations\.blocked\(sourceFile, result\)/.test(pipelineAuthority),
  operationPreservesExactResponseAndSourceIdentity: /relateSourceFileIdentity: \(candidate: SourceFile\) => laravelSourceIdentitySemantics\.relateSourceFiles\(sourceFile, candidate\),[\s\S]*?response,/.test(integration),
  operationIsInterfaceFirstExport: /export const phpSourceInvocationSemanticPipelineIntegrationJudgmentOperations: PhpSourceInvocationSemanticPipelineIntegrationJudgmentOperationsInterface = Object\.freeze/.test(integration),
  consumerUsesDomainOperationInsteadOfGenericDispatch: /return response\.toControllerInvocationSemanticJudgment\(sourceFile\)/.test(invocationAuthority) && !/response\.continueWith/.test(invocationAuthority),
  oldGenericHandlerIsNotRetainedInIntegrationModule: !/continueWith|IntegrationHandlers<Result>/.test(integration),
  canonicalIdentityAuthorityStillOwnsIdentityRelation: /export const laravelSourceIdentitySemantics: LaravelSourceIdentitySemanticsInterface = Object\.freeze/.test(sourceIdentity),
  protectedCollectionsInvariantOneNewlineByte: collections.length === 1 && collections[0] === 10,
  deletedRelationFoundationRemainsAbsent: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationsDir, name))),
  changedTypeScriptFilesTranspileWithoutSyntaxDiagnostics: syntaxDiagnostics.length === 0,
};
const regression3068 = spawnSync(process.execPath, [path.join(root, 'scripts/audits/audit-phase3068-upstream-pipeline-domain-integration.cjs')], { cwd: root, encoding: 'utf8' });
const regression3067 = spawnSync(process.execPath, [path.join(root, 'scripts/audits/audit-phase3067-schema-evidence-domain-operations.cjs')], { cwd: root, encoding: 'utf8' });
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const result = {
  phase: 3069,
  title: 'Fully Explicit Typed Runtime Scanner Operations — integration outcome to controller judgment domain operation',
  status: failed.length === 0 && regression3068.status === 0 && regression3067.status === 0 ? 'PASS' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  syntaxDiagnostics,
  regressions: {
    phase3068UpstreamPipelineDomainIntegration: regression3068.status === 0 ? 'PASS' : 'FAIL',
    phase3067SchemaEvidenceDomainOperations: regression3067.status === 0 ? 'PASS' : 'FAIL',
  },
  runtimeTrace: [
    'PHP whole-file source pipeline produces complete or blocked invocation evidence.',
    'Source-binding judgment composes exact pipeline evidence into one of four closed integration outcomes.',
    'Each integration outcome owns toControllerInvocationSemanticJudgment(sourceFile), a domain-specific operation with no generic Result callback.',
    'The operation preserves the exact integration outcome as the response and attaches canonical source-file identity relation semantics.',
    'Controller invocation authority calls the outcome-owned operation rather than redispatching through generic handlers.',
    'Controller invocation judgment continues to controller scanner, source-AST pipeline, manifest builder, and CLI scan/sync blocker gate.',
  ],
  verification: {
    structuralAudit: failed.length === 0 ? 'PASS' : 'FAIL',
    changedFileSyntaxTranspile: syntaxDiagnostics.length === 0 ? 'PASS' : 'FAIL',
    phase3068Regression: regression3068.status === 0 ? 'PASS' : 'FAIL',
    phase3067Regression: regression3067.status === 0 ? 'PASS' : 'FAIL',
    strictTypeScript: 'BLOCKED — targeted dependency graph reports 585 repository diagnostics from deleted relation-foundation imports, the protected one-byte collections.ts invariant, and ambient type/dependency gaps; none of the four changed files appears in the diagnostic output. Syntax transpilation is not a type-check.',
    vitestRuntime: 'NOT_RUN — workspace Vitest installation is incomplete.',
    endToEndPhpCliManifestFixture: 'NOT_RUN',
    globalGenericOrPrimitiveElimination: 'NOT_CLAIMED',
  },
  remainingRisks: [
    'The controller invocation input ADT still exposes generic continueWith; it is the next upstream boundary to migrate.',
    'Source-file identity relation judgments still expose generic continuation in their own domain.',
    'No claim is made that all generic callbacks or primitives have been removed repository-wide.',
    'Full PHP → CLI → manifest/IR execution remains unverified.',
  ],
};
for (const [name, pass] of Object.entries(checks)) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${result.passed}/${result.total} checks passed`);
console.log(`Phase 3068 regression: ${result.regressions.phase3068UpstreamPipelineDomainIntegration}`);
console.log(`Phase 3067 regression: ${result.regressions.phase3067SchemaEvidenceDomainOperations}`);
if (syntaxDiagnostics.length) console.error(JSON.stringify(syntaxDiagnostics, null, 2));
fs.writeFileSync(path.join(root, 'PHASE3069_INTEGRATION_TO_CONTROLLER_JUDGMENT_DOMAIN_OPERATION_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
if (result.status !== 'PASS') process.exit(1);
