const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const terminal = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const changed = [
  'packages/core/src/types/upstream/phpSourceFrontendInterface.ts',
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
  sourceReadFailureHasClosedNormalizedEvidence: /interface PhpSourceDocumentReadFailureEvidence[\s\S]*?failureCode:\s*FilesystemFailureCode[\s\S]*?failureName:\s*StringValue[\s\S]*?failureMessage:\s*StringValue/.test(upstream),
  rejectedSettlementDoesNotCarryUnknown: /interface PhpSourceDocumentReadOperationRejectedEvidence[\s\S]*?failure:\s*PhpSourceDocumentReadFailureEvidence/.test(upstream) && !/interface PhpSourceDocumentReadOperationRejectedEvidence[\s\S]*?failure:\s*unknown/.test(upstream),
  rejectedFactoryAcceptsOnlyNormalizedEvidence: /rejected:\s*\(sourceFile:\s*SourceFile,\s*failure:\s*PhpSourceDocumentReadFailureEvidence\)/.test(upstream),
  rejectionPreservesTypedEvidenceThroughDomainOperation: /preserveFailureEvidence:\s*\(\)\s*=>\s*PhpSourceDocumentReadFailureEvidence/.test(upstream) && /preserveFailureEvidence:\s*\(\):\s*PhpSourceDocumentReadFailureEvidence\s*=>\s*failure/.test(upstream),
  nodeFailureIsNormalizedBeforeEnteringUpstreamAdt: /failure =>\s*\{\s*const observation = nodeFilesystemFailureObservation\.observe\(failure\);[\s\S]*?phpSourceDocumentReadOperationSettlementFactory\.rejected\(requestedSourceFile, Object\.freeze\([\s\S]*?failureCode:\s*observation\.failureCode[\s\S]*?failureName:\s*observation\.failureName[\s\S]*?failureMessage:\s*observation\.failureMessage/.test(composition),
  sourceFileIdentityIsRetainedOnRejectedRead: /interface PhpSourceDocumentReadOperationRejectedEvidence[\s\S]*?sourceFile:\s*SourceFile/.test(upstream),
  rejectedBatchRetainsNormalizedReadEvidence: /readonly rejections:\s*readonly PhpSourceDocumentReadOperationRejectedEvidence\[\]/.test(upstream) && /rejections:\s*rejected/.test(upstream),
  manifestTerminalStillReceivesReadBlockers: /sourceDocumentReadOperationRejected\([\s\S]*?rejections:\s*rejectedBatch\.rejections/.test(composition) && /rejections:\s*readonly PhpSourceDocumentReadOperationRejectedEvidence\[\]/.test(terminal),
  readerContractRemainsInterfaceFirst: /export interface PhpSourceDocumentReaderInterface/.test(upstream) && /export const phpSourceDocumentReadOperationSettlementFactory:\s*PhpSourceDocumentReadOperationSettlementFactoryInterface\s*=\s*Object\.freeze/.test(upstream),
  noExportedFunctionDeclarationsInChangedUpstreamFile: !/^export\s+function\s+/m.test(upstream),
  protectedCollectionsInvariantOneNewlineByte: collections.length === 1 && collections[0] === 10,
  deletedRelationFoundationRemainsAbsent: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relations, name))),
  changedFilesTranspileWithoutSyntaxDiagnostics: syntaxDiagnostics.length === 0,
};
const regressions = [
  ['phase3075', 'scripts/audits/audit-phase3075-canonicalization-failure-evidence.cjs'],
  ['phase3074', 'scripts/audits/audit-phase3074-source-project-canonicalization-domain-operations.cjs'],
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
  phase: 3076,
  title: 'Fully Explicit Typed Runtime Scanner Operations — source document read failure evidence normalization',
  status: failed.length === 0 && regressions.every(regression => regression.status === 'PASS') ? 'PASS' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  syntaxDiagnostics,
  regressions,
  runtimeTrace: [
    'CLI scan/sync composition schedules source reads for the discovered canonical source-file inventory.',
    'A fulfilled read becomes PhpSourceDocumentReadOperationFulfilledEvidence; a rejected read is normalized at the Node adapter boundary.',
    'The rejected operation carries a closed filesystem failure code plus normalized failure name and message, not the raw rejected Promise payload.',
    'The upstream rejected-read ADT exposes preserveFailureEvidence() and the read batch retains the typed rejection evidence.',
    'The manifest terminal still receives all rejected source identities and normalized diagnostics; rejected reads are not converted to empty successful source documents.',
    'End-to-end PHP → CLI → manifest execution and whole-workspace strict typechecking are not claimed.',
  ],
  verification: {
    structuralAudit: failed.length === 0 ? 'PASS' : 'FAIL',
    changedFileSyntaxTranspile: syntaxDiagnostics.length === 0 ? 'PASS' : 'FAIL',
    regressions: regressions.every(regression => regression.status === 'PASS') ? 'PASS' : 'FAIL',
    wholeProgramStrictTypeScript: 'NOT_CLAIMED',
    endToEndPhpCliManifestExecution: 'NOT_RUN',
    globalPrimitiveElimination: 'NOT_CLAIMED — platform rejection inspection remains at the CLI adapter boundary; this phase only closes the source-read rejection evidence crossing into upstream.',
  },
  remainingRisks: [
    'The filesystem error code is normalized to the existing closed FilesystemFailureCode ADT; an unrecognized platform code remains explicitly unrecognized.',
    'The upstream source-read settlement still uses a generic continueWith operation for fulfilled/rejected routing; replacing it requires a domain-owned follow-up contract and regression coverage.',
    'The CLI adapter still uses primitive host-error inspection, which is appropriate at the platform boundary but remains a modeling frontier.',
  ],
};
for (const [name, pass] of Object.entries(checks)) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
for (const regression of regressions) console.log(`${regression.phase} regression: ${regression.status}`);
console.log(`${result.status}: ${result.passed}/${result.total} checks passed`);
fs.writeFileSync(path.join(root, 'PHASE3076_SOURCE_READ_FAILURE_EVIDENCE_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
fs.writeFileSync(path.join(root, 'PHASE3076_AUDIT.log'), `${Object.entries(checks).map(([name, pass]) => `${pass ? 'PASS' : 'FAIL'} ${name}`).join('\n')}\n${regressions.map(regression => `${regression.phase} regression: ${regression.status}`).join('\n')}\n${result.status}: ${result.passed}/${result.total} checks passed\n`);
if (result.status !== 'PASS') process.exit(1);
