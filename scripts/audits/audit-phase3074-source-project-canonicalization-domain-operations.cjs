const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const identity = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const canonicalizationDomain = identity.split('/** Typed identity relations')[0];
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const input = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const coreIndex = read('packages/core/src/index.ts');
const changed = [
  'packages/core/src/types/upstream/sourceProjectIdentity.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts',
];
const syntaxDiagnostics = changed.flatMap(file => {
  const source = read(file);
  const result = ts.transpileModule(source, {
    fileName: path.join(root, file),
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
  });
  return (result.diagnostics ?? []).map(diagnostic => ({ file, code: diagnostic.code, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n') }));
});
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relations = path.join(root, 'packages/core/src/semantic/relations');
const checks = {
  canonicalizationHandlersAndGenericResultRemoved: !/ControllerSourceProjectIdentityCanonicalizationHandlers|ControllerSourceProjectIdentityCanonicalizationJudgmentOperations|continueWith\s*:\s*<Result>/.test(canonicalizationDomain),
  canonicalizedOutcomeOwnsSourceDiscoveryIdentityOperation: /continueToSourceDiscoveryIdentity:\s*\(\)\s*=>\s*SourceProjectIdentity/.test(identity),
  blockedOutcomeOwnsFailurePreservationOperation: /preserveFailureEvidence:\s*\(\)\s*=>\s*ControllerSourceProjectIdentityCanonicalizationBlockedEvidence/.test(identity),
  canonicalizationOutcomesAreClosedTypedUnion: /export type ControllerSourceProjectIdentityCanonicalizationResult\s*=\s*\| ControllerSourceProjectIdentityCanonicalizedJudgment\s*\| ControllerSourceProjectIdentityCanonicalizationBlockedJudgment/.test(identity),
  canonicalizationFactoryIsInterfaceFirst: /export const controllerSourceProjectIdentityCanonicalization:\s*ControllerSourceProjectIdentityCanonicalizationInterface\s*=\s*Object\.freeze/.test(composition),
  filesystemRealpathStillOwnsCanonicalRoot: /fs\.realpath\(input\.sourceProject\.root\.value\.value\)/.test(composition),
  queryPolicyDefaultAndExplicitBranchesPreserved: /onDefault:[\s\S]*onExplicit:[\s\S]*policyIntent:\s*selection\.intent/.test(composition),
  compositionConsumesDomainOperationsInsteadOfGenericContinuation: /identity\.preserveFailureEvidence\(\)/.test(input) && /identity\.continueToSourceDiscoveryIdentity\(\)/.test(input) && !/identity\.continueWith\(/.test(input),
  blockedManifestTerminalStillReceivesOriginalTypedJudgment: /sourceProjectIdentityBlocked\(Object\.freeze\([\s\S]*identity:\s*blockedIdentity/.test(composition),
  obsoleteGenericTypesNotPubliclyReexported: !/ControllerSourceProjectIdentityCanonicalizationHandlers|ControllerSourceProjectIdentityCanonicalizationJudgmentOperations/.test(coreIndex),
  noExportedFunctionDeclarationsInChangedUpstreamIdentity: !/^export\s+function\s+/m.test(identity),
  protectedCollectionsInvariantOneNewlineByte: collections.length === 1 && collections[0] === 10,
  deletedRelationFoundationRemainsAbsent: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relations, name))),
  changedFilesTranspileWithoutSyntaxDiagnostics: syntaxDiagnostics.length === 0,
};
const regressions = [
  ['phase3072', 'scripts/audits/audit-phase3072-statement-boundary-domain-operations.cjs'],
  ['phase3071', 'scripts/audits/audit-phase3071-scanner-control-domain-operations.cjs'],
  ['phase3070', 'scripts/audits/audit-phase3070-controller-invocation-input-domain-operations.cjs'],
  ['phase3069', 'scripts/audits/audit-phase3069-integration-to-controller-judgment-domain-operation.cjs'],
].map(([phase, script]) => {
  const run = spawnSync(process.execPath, [path.join(root, script)], { cwd: root, encoding: 'utf8' });
  return { phase, status: run.status === 0 ? 'PASS' : 'FAIL', output: `${run.stdout || ''}${run.stderr || ''}`.slice(-1000) };
});
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const result = {
  phase: 3074,
  title: 'Fully Explicit Typed Runtime Scanner Operations — source-project canonicalization domain operations',
  status: failed.length === 0 && regressions.every(regression => regression.status === 'PASS') ? 'PASS' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  syntaxDiagnostics,
  regressions,
  runtimeTrace: [
    'CLI scan/sync creates the requested SourceProjectIdentity and invokes the manifest scan operation.',
    'Manifest composition input calls the injected upstream canonicalization interface before source discovery.',
    'The filesystem adapter resolves the root with fs.realpath and preserves default versus explicit query-policy selection.',
    'The canonicalized ADT exposes continueToSourceDiscoveryIdentity; the blocked ADT exposes preserveFailureEvidence. Generic continueWith<Result> is removed from this canonicalization result.',
    'The CLI composition boundary maps the blocked judgment to the existing source-project-identity-blocked manifest terminal; the canonicalized judgment proceeds into source discovery and manifest construction.',
    'Manifest projection, validation, generator save, and persistence remain in the existing CLI scan path; no end-to-end execution is claimed.',
  ],
  verification: {
    structuralAudit: failed.length === 0 ? 'PASS' : 'FAIL',
    changedFileSyntaxTranspile: syntaxDiagnostics.length === 0 ? 'PASS' : 'FAIL',
    regressions: regressions.every(regression => regression.status === 'PASS') ? 'PASS' : 'FAIL',
    endToEndPhpCliManifestExecution: 'NOT_RUN',
    wholeProgramStrictTypeScript: 'NOT_CLAIMED',
    rawFailurePayload: 'RETAINED as unknown at the Node filesystem rejection boundary and blocked judgment; normalization into a closed failure-evidence ADT remains a separate migration frontier.',
    globalPrimitiveElimination: 'NOT_CLAIMED — runtime adapters still use filesystem boundary interpretation and normal branching; this phase removes only the generic canonicalization continuation.',
  },
  remainingRisks: [
    'The blocked canonicalization judgment retains failure: unknown so the original Node rejection payload is not discarded. A later migration must replace this with an explicit evidence model without losing diagnostically useful data.',
    'A discriminated switch remains at the CLI composition boundary because core cannot depend on CLI manifest terminal types; this preserves dependency direction and does not duplicate domain classification.',
    'This audit proves source structure and syntax transpilation, not full-project type correctness or a live PHP-to-manifest integration run.',
  ],
};
for (const [name, pass] of Object.entries(checks)) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
for (const regression of regressions) console.log(`${regression.phase} regression: ${regression.status}`);
console.log(`${result.status}: ${result.passed}/${result.total} checks passed`);
fs.writeFileSync(path.join(root, 'PHASE3074_SOURCE_PROJECT_CANONICALIZATION_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
if (result.status !== 'PASS') process.exit(1);
