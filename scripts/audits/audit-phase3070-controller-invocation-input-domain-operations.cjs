const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contractPath = 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts';
const authorityPath = 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts';
const contract = read(contractPath);
const authority = read(authorityPath);
const changedFiles = [contractPath, authorityPath];
const syntaxDiagnostics = changedFiles.flatMap(relative => {
  const fileName = path.join(root, relative);
  const output = ts.transpileModule(fs.readFileSync(fileName, 'utf8'), {
    fileName,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
  });
  return (output.diagnostics ?? []).map(diagnostic => ({ file: relative, code: diagnostic.code, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n') }));
});
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationsDir = path.join(root, 'packages/core/src/semantic/relations');
const checks = {
  genericInputHandlersRemoved: !/LaravelControllerInvocationSemanticInputHandlers|continueWith:\s*<Result>/.test(contract + authority),
  explicitInputDomainOperationsDeclared: /interface LaravelControllerInvocationSemanticInputDomainOperationsInterface/.test(contract) && /judgePipelineNotProvided/.test(contract) && /judgePipelineProvided/.test(contract),
  notProvidedInputOwnsDomainOperation: /controller_invocation_pipeline_not_provided[\s\S]*?toControllerInvocationSemanticJudgment:\s*\(operations:[\s\S]*?judgePipelineNotProvided/.test(authority),
  providedInputOwnsDomainOperation: /controller_invocation_pipeline_provided[\s\S]*?toControllerInvocationSemanticJudgment:\s*\(operations:[\s\S]*?judgePipelineProvided/.test(authority),
  authorityConsumesInputOperationDirectly: /judge\(input: LaravelControllerInvocationSemanticInput\)[\s\S]*?return input\.toControllerInvocationSemanticJudgment\(this\)/.test(authority),
  noGenericHandlerDispatchRemainsInJudge: !/judge\(input: LaravelControllerInvocationSemanticInput\)[\s\S]*?continueWith|handlers\.onPipelineNotProvided|handlers\.onPipelineProvided/.test(authority),
  notProvidedOutcomePreserved: /judgePipelineNotProvided[\s\S]*?project\(notConnectedPipelineEvidence\(\)\)/.test(authority),
  providedOutcomePreservesBindingAndIntegration: /judgePipelineProvided[\s\S]*?sourceBinding\.bind\([\s\S]*?integration\.project\(phpSourceInvocationPipelineEvidenceFromSourceBinding\.project\(binding\)\)/.test(authority),
  inputContractVersionUpdated: /readonly version: 18/.test(contract) && /version: 18/.test(authority),
  exportedFactoryRemainsInterfaceFirst: /export const laravelControllerInvocationSemanticInputFactory:\s*LaravelControllerInvocationSemanticInputFactoryInterface\s*= Object\.freeze/.test(authority),
  exportedRuntimeAuthorityIsInterfaceFirstObject: /export const laravelControllerInvocationSemanticJudgmentAuthority:\s*LaravelControllerInvocationSemanticJudgmentAuthorityInterface\s*= Object\.freeze/.test(authority),
  protectedCollectionsInvariantOneNewlineByte: collections.length === 1 && collections[0] === 10,
  deletedRelationFoundationRemainsAbsent: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationsDir, name))),
  changedTypeScriptFilesTranspileWithoutSyntaxDiagnostics: syntaxDiagnostics.length === 0,
};
const regressions = [
  ['phase3069', 'scripts/audits/audit-phase3069-integration-to-controller-judgment-domain-operation.cjs'],
  ['phase3068', 'scripts/audits/audit-phase3068-upstream-pipeline-domain-integration.cjs'],
  ['phase3067', 'scripts/audits/audit-phase3067-schema-evidence-domain-operations.cjs'],
].map(([phase, script]) => {
  const run = spawnSync(process.execPath, [path.join(root, script)], { cwd: root, encoding: 'utf8' });
  return { phase, status: run.status === 0 ? 'PASS' : 'FAIL', output: `${run.stdout || ''}${run.stderr || ''}`.slice(-1800) };
});
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const result = {
  phase: 3070,
  title: 'Fully Explicit Typed Runtime Scanner Operations — controller invocation input domain operations',
  status: failed.length === 0 && regressions.every(regression => regression.status === 'PASS') ? 'PASS' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  syntaxDiagnostics,
  regressions,
  runtimeTrace: [
    'CLI controller scanning obtains a canonical controller source and its optional whole-file PHP invocation pipeline result.',
    'The upstream invocation-input factory constructs one of two closed inputs: pipeline-not-provided or pipeline-provided.',
    'Each input exposes toControllerInvocationSemanticJudgment(domainOperations); it no longer stores a generic Result callback or handler bundle.',
    'The invocation authority receives that explicit operation and executes the matching domain operation.',
    'The no-pipeline operation produces the not-connected integration outcome; the provided-pipeline operation preserves source binding and integrated response outcome.',
    'The integration outcome converts to the exact controller judgment while preserving source identity relation semantics; downstream scanner and manifest consume that judgment.',
  ],
  verification: {
    structuralAudit: failed.length === 0 ? 'PASS' : 'FAIL',
    changedFileSyntaxTranspile: syntaxDiagnostics.length === 0 ? 'PASS' : 'FAIL',
    regressions: regressions.every(regression => regression.status === 'PASS') ? 'PASS' : 'FAIL',
    strictTypeScript: 'NOT_CLAIMED — syntax transpilation does not establish whole-program type correctness; the repository has previously observed dependency-graph diagnostics.',
    vitestRuntime: 'NOT_RUN — workspace Vitest installation is incomplete.',
    endToEndPhpCliManifestFixture: 'NOT_RUN',
    globalPrimitiveOrGenericElimination: 'NOT_CLAIMED',
  },
  remainingRisks: [
    'Other upstream domains still expose generic continuation operations; this phase only migrates the controller invocation input boundary.',
    'The public authority is an interface-first object, while a class-backed executor remains internally for compatibility; this phase does not claim a repository-wide conversion of every implementation to object literals.',
    'Full PHP → CLI → manifest/IR execution remains unverified.',
  ],
};
for (const [name, pass] of Object.entries(checks)) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${result.passed}/${result.total} checks passed`);
for (const regression of regressions) console.log(`${regression.phase} regression: ${regression.status}`);
if (syntaxDiagnostics.length) console.error(JSON.stringify(syntaxDiagnostics, null, 2));
fs.writeFileSync(path.join(root, 'PHASE3070_CONTROLLER_INVOCATION_INPUT_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
if (result.status !== 'PASS') process.exit(1);
