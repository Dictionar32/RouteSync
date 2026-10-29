const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstreamPath = 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts';
const compositionPath = 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts';
const cliOperationPath = 'packages/cli/src/manifestScanOperationInterface.ts';
const upstream = read(upstreamPath);
const composition = read(compositionPath);
const cliOperation = read(cliOperationPath);
const report = read('PHASE3079_FULLY_EXPLICIT_RUNTIME_SCANNER_UPSTREAM_CLI_MANIFEST_TRACE.md');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relations = path.join(root, 'packages/core/src/semantic/relations');
const diagnostics = [upstreamPath, compositionPath, cliOperationPath].flatMap(file => {
  const result = ts.transpileModule(read(file), {
    fileName: path.join(root, file), reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, strict: true },
  });
  return (result.diagnostics ?? []).map(d => ({ file, code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') }));
});
const batch = upstream.slice(upstream.indexOf('export interface PhpSourceDocumentReadOperationBatchFulfilledEvidence'), upstream.indexOf('/** Aggregate result for a discovered source batch'));
const checks = {
  cliScanSyncOperationFeedsCompositionAuthority: /routeSyncCliManifestScanOperationFactory/.test(cliOperation) && /manifestBuilderOperationPreparation|ControllerInvocationManifestCompositionAuthority/.test(cliOperation + composition),
  compositionReadsDiscoveredSourcesThroughSettlementOperation: /discoveredSourceReadSettlementOperation\.readAll/.test(composition),
  settlementFactoryInterfaceFirst: /export const phpSourceDocumentReadOperationSettlementFactory:\s*PhpSourceDocumentReadOperationSettlementFactoryInterface\s*=\s*Object\.freeze/.test(upstream),
  rejectedIdentityAccumulatedAtBoundary: /includeRejected:[\s\S]*?sourceFiles\.include\(settlement\.sourceFile\)/.test(batch),
  noPostHocRejectionReduce: !/rejected\.reduce\(/.test(batch),
  rejectionEvidenceRetainedAtManifestTerminal: /sourceDocumentReadOperationRejected\([\s\S]*?sourceFiles:\s*rejectedBatch\.sourceFiles,[\s\S]*?rejections:\s*rejectedBatch\.rejections/.test(composition),
  genericBatchContinuationExplicitlyFlagged: /generic `continueWith<Result>`/.test(report) && /continueWith:\s*<Result>/.test(batch),
  traversalArithmeticRemovedFromSourceReadBatch: !/settlements\s*\[\s*index\s*\]/.test(batch) && !/results\s*\[\s*index\s*\]/.test(batch) && !/index\s*\+\s*1/.test(batch) && /ordered sequence iteration|domain sequence/.test(batch),
  protectedCollectionsInvariantOneNewlineByte: collections.length === 1 && collections[0] === 10,
  deletedRelationFoundationAbsent: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relations, name))),
  changedRuntimeFilesTranspileWithoutDiagnostics: diagnostics.length === 0,
};
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const result = {
  phase: 3079,
  title: 'Fully Explicit Typed Runtime Scanner Operations — upstream CLI manifest trace',
  status: failed.length === 0 ? 'PASS_WITH_OPEN_FRONTIERS' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  syntaxDiagnostics: diagnostics,
  verification: {
    focusedStructuralAudit: failed.length === 0 ? 'PASS' : 'FAIL',
    TypeScriptTranspileSyntax: diagnostics.length === 0 ? 'PASS' : 'FAIL',
    wholeWorkspaceStrictTypeScript: 'NOT_RUN — dependencies are not installed in extracted workspace',
    fullTestSuite: 'NOT_RUN',
    phpCliManifestGeneratorEndToEnd: 'NOT_RUN',
  },
  openFrontiers: [
    'Replace generic source-read batch continuation with a source-read-owned, manifest-neutral domain contract.',
    'Trace field-level provenance from source reads through identity binding, semantic invocation, manifest projection, and canonical JSON.',
    'Normalize source-discovery blocker evidence at the filesystem adapter boundary.',
    'Audit query-policy and manifest-builder continuations on the reachable scan/sync path.',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE3079_RUNTIME_SCANNER_UPSTREAM_CLI_MANIFEST_TRACE_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
for (const [name, passed] of Object.entries(checks)) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`${result.status}: ${result.passed}/${result.total} structural checks passed\n`);
if (result.status === 'FAIL') process.exitCode = 1;
