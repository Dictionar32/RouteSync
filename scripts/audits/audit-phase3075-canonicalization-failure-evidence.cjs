const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const identity = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const compositionInterface = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const changed = [
  'packages/core/src/types/upstream/sourceProjectIdentity.ts',
  'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
];
const syntaxDiagnostics = changed.flatMap(file => {
  const result = ts.transpileModule(read(file), {
    fileName: path.join(root, file),
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
  });
  return (result.diagnostics ?? []).map(diagnostic => ({ file, code: diagnostic.code, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n') }));
});
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relations = path.join(root, 'packages/core/src/semantic/relations');
const checks = {
  blockedEvidenceNoLongerExportsOpaqueUnknownFailure: /ControllerSourceProjectIdentityCanonicalizationBlockedEvidence[\s\S]*?failureMessage:\s*StringValue/.test(identity) && !/ControllerSourceProjectIdentityCanonicalizationBlockedEvidence[\s\S]*?failure:\s*unknown/.test(identity),
  blockedJudgmentUsesNormalizedDiagnosticFields: /ControllerSourceProjectIdentityCanonicalizationBlockedJudgment[\s\S]*?failureName:\s*StringValue[\s\S]*?failureMessage:\s*StringValue/.test(identity) && !/ControllerSourceProjectIdentityCanonicalizationBlockedJudgment[\s\s\S]*?failure:\s*unknown/.test(identity),
  failureEvidencePreservationOperationRemainsDomainOwned: /preserveFailureEvidence:\s*\(\)\s*=>\s*ControllerSourceProjectIdentityCanonicalizationBlockedEvidence/.test(identity),
  nodeRejectionIsNormalizedAtCliAdapterBoundary: /nodeFilesystemFailureObservation[\s\S]*?failureName:\s*stringValue\.create\([\s\S]*?failureMessage:\s*stringValue\.create\(/.test(composition),
  normalizedFailureCodeRemainsClosedTypedAdt: /failureCode:\s*FilesystemFailureCode/.test(composition) && /filesystemFailureCodeFactory\.unrecognized\(\)/.test(composition),
  requestedIdentityAndFilesystemLocationPreserved: /requested:\s*input\.sourceProject[\s\S]*?location,/.test(composition),
  blockedManifestTerminalStillReceivesEvidence: /sourceProjectIdentityBlocked\([\s\S]*?identity:\s*blockedIdentity/.test(composition),
  noRawFailurePayloadInCanonicalizationContract: !/readonly failure:\s*unknown/.test(identity),
  canonicalizationStillInterfaceFirst: /export const controllerSourceProjectIdentityCanonicalization:\s*ControllerSourceProjectIdentityCanonicalizationInterface\s*=\s*Object\.freeze/.test(composition),
  noExportedFunctionDeclarationInChangedUpstreamFile: !/^export\s+function\s+/m.test(identity),
  protectedCollectionsInvariantOneNewlineByte: collections.length === 1 && collections[0] === 10,
  deletedRelationFoundationRemainsAbsent: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relations, name))),
  changedFilesTranspileWithoutSyntaxDiagnostics: syntaxDiagnostics.length === 0,
  compositionInterfaceStillTypesBlockedTerminal: /sourceProjectIdentityBlocked:\s*\(judgment:\s*ControllerInvocationManifestSourceProjectIdentityBlockedJudgment\)/.test(compositionInterface),
};
const regressions = [
  ['phase3074', 'scripts/audits/audit-phase3074-source-project-canonicalization-domain-operations.cjs'],
  ['phase3072', 'scripts/audits/audit-phase3072-statement-boundary-domain-operations.cjs'],
  ['phase3071', 'scripts/audits/audit-phase3071-scanner-control-domain-operations.cjs'],
  ['phase3070', 'scripts/audits/audit-phase3070-controller-invocation-input-domain-operations.cjs'],
  ['phase3069', 'scripts/audits/audit-phase3069-integration-to-controller-judgment-domain-operation.cjs'],
].map(([phase, script]) => {
  const run = spawnSync(process.execPath, [path.join(root, script)], { cwd: root, encoding: 'utf8' });
  return { phase, status: run.status === 0 ? 'PASS' : 'FAIL', output: `${run.stdout || ''}${run.stderr || ''}`.slice(-1200) };
});
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const result = {
  phase: 3075,
  title: 'Fully Explicit Typed Runtime Scanner Operations — canonicalization failure evidence normalization',
  status: failed.length === 0 && regressions.every(regression => regression.status === 'PASS') ? 'PASS' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  syntaxDiagnostics,
  regressions,
  runtimeTrace: [
    'CLI scan/sync invokes the manifest composition authority with the requested SourceProjectIdentity.',
    'The interface-first Node filesystem adapter attempts fs.realpath before source discovery.',
    'On rejection, the Node boundary classifies the filesystem code and normalizes Error.name and Error.message into StringValue fields.',
    'The upstream blocked canonicalization judgment retains requested identity, typed filesystem code, root location, and normalized diagnostics; the raw platform rejection no longer crosses the upstream ADT boundary.',
    'preserveFailureEvidence() projects the normalized evidence to the existing CLI source-project-identity-blocked manifest terminal.',
    'Canonical success still proceeds through discovery, source reads, invocation semantics, inventory, manifest projection, validation, generator, and persistence; end-to-end execution is not claimed.',
  ],
  verification: {
    structuralAudit: failed.length === 0 ? 'PASS' : 'FAIL',
    changedFileSyntaxTranspile: syntaxDiagnostics.length === 0 ? 'PASS' : 'FAIL',
    regressions: regressions.every(regression => regression.status === 'PASS') ? 'PASS' : 'FAIL',
    wholeProgramStrictTypeScript: 'NOT_CLAIMED',
    endToEndPhpCliManifestExecution: 'NOT_RUN',
    globalPrimitiveElimination: 'NOT_CLAIMED — remaining platform-boundary unknown and fallback operators are isolated in the Node adapter; this phase only prevents raw rejection payloads from crossing the canonicalization ADT.',
  },
  remainingRisks: [
    'The normalized name/message are StringValue wrappers but their underlying payload remains text; this is deliberate diagnostic data, not a semantic branch discriminator.',
    'Non-Error rejection values are represented by an explicit diagnostic label and message; arbitrary thrown object internals are not retained. If those internals are operationally required, model a safe bounded diagnostic schema rather than reintroducing unknown into the domain ADT.',
    'The CLI composition switch and unrelated filesystem discovery failure: unknown remain outside this focused canonicalization migration.',
  ],
};
for (const [name, pass] of Object.entries(checks)) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
for (const regression of regressions) console.log(`${regression.phase} regression: ${regression.status}`);
console.log(`${result.status}: ${result.passed}/${result.total} checks passed`);
fs.writeFileSync(path.join(root, 'PHASE3075_CANONICALIZATION_FAILURE_EVIDENCE_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
if (result.status !== 'PASS') process.exit(1);
