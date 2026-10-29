const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const upstreamPath = 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts';
const compositionPath = 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts';
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = read(upstreamPath);
const composition = read(compositionPath);
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relations = path.join(root, 'packages/core/src/semantic/relations');
const diagnostics = [upstreamPath, compositionPath].flatMap(file => {
  const result = ts.transpileModule(read(file), {
    fileName: path.join(root, file), reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
  });
  return (result.diagnostics ?? []).map(d => ({ file, code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') }));
});
const operationBatch = upstream.slice(upstream.indexOf('export interface PhpSourceDocumentReadOperationBatchFulfilledEvidence'), upstream.indexOf('/** Aggregate result for a discovered source batch'));
const checks = {
  rejectedInventoryAccumulatedAtDomainBoundary: /includeRejected:[\s\S]*?sourceFiles\.include\(settlement\.sourceFile\)/.test(operationBatch),
  finalRejectedEvidenceUsesAccumulatedInventory: /PhpSourceDocumentReadOperationBatchRejectedEvidence = Object\.freeze\([\s\S]*?sourceFiles,\s*rejections: rejected/.test(operationBatch),
  postHocReduceRemovedFromBatchFinalization: !/rejected\.reduce\(/.test(operationBatch),
  sourceInventorySeededOnceAtAccumulatorCreation: /createAccumulator\(Object\.freeze\(\[\]\), Object\.freeze\(\[\]\), sourceFileInventoryFactory\.empty\(\)\)/.test(operationBatch),
  fulfilledReadOrderStillPreserved: /includeFulfilled:[\s\S]*?Object\.freeze\(\[\.\.\.reads, settlement\.read\]\)/.test(operationBatch),
  rejectionOrderAndEvidenceStillPreserved: /includeRejected:[\s\S]*?Object\.freeze\(\[\.\.\.rejected, settlement\]\)/.test(operationBatch) && /rejections: rejected/.test(operationBatch),
  settlementDomainOperationRemainsExplicit: /contributeToBatch:\s*\(accumulator:\s*PhpSourceDocumentReadOperationBatchAccumulator\)[\s\S]*?accumulator\.includeRejected\(settlement\)/.test(upstream),
  manifestBlockedTerminalRetainsRejectionEvidence: /sourceDocumentReadOperationRejected\([\s\S]*?sourceFiles:\s*rejectedBatch\.sourceFiles,[\s\S]*?rejections:\s*rejectedBatch\.rejections/.test(composition),
  canonicalRuntimeFactoryRemainsInterfaceFirst: /export const phpSourceDocumentReadOperationSettlementFactory:\s*PhpSourceDocumentReadOperationSettlementFactoryInterface\s*=\s*Object\.freeze/.test(upstream),
  noExportedFunctionDeclarationInChangedUpstreamFile: !/^export\s+function\s+/m.test(upstream),
  protectedCollectionsInvariantOneNewlineByte: collections.length === 1 && collections[0] === 10,
  deletedRelationFoundationRemainsAbsent: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relations, name))),
  changedFilesTranspileWithoutSyntaxDiagnostics: diagnostics.length === 0,
};
const regressions = ['PHASE3077_AUDIT.log', 'PHASE3076_AUDIT.log', 'PHASE3075_AUDIT.log', 'PHASE3074_AUDIT.log', 'PHASE3072_AUDIT.log'].map(file => ({ file, status: fs.existsSync(path.join(root, file)) ? 'ARTIFACT_PRESENT_NOT_RERUN' : 'MISSING' }));
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const result = {
  phase: 3078,
  title: 'Fully Explicit Typed Runtime Scanner Operations — source-read rejection inventory domain operations',
  status: failed.length === 0 ? 'PASS' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  syntaxDiagnostics: diagnostics,
  regressions,
  runtimeTrace: [
    'CLI scan/sync awaits source reads for the discovered canonical source inventory.',
    'Fulfilled and rejected read settlements contribute to a source-read-owned batch accumulator.',
    'Each rejected settlement adds its source identity to SourceFileInventory at the moment it enters the domain accumulator.',
    'The rejected batch carries the accumulated inventory and the ordered normalized rejection evidence to the existing blocked manifest terminal.',
  ],
  verification: {
    structuralAudit: failed.length === 0 ? 'PASS' : 'FAIL',
    changedFileSyntaxTranspile: diagnostics.length === 0 ? 'PASS' : 'FAIL',
    regressionAuditExecution: 'NOT_RUN — prior audit artifacts are checked for presence only',
    wholeWorkspaceStrictTypeScript: 'NOT_CLAIMED',
    endToEndPhpCliManifestExecution: 'NOT_RUN',
    globalPrimitiveElimination: 'NOT_CLAIMED — the final batch judgment still exposes continueWith and the collection traversal remains index-based.',
  },
  remainingFrontiers: [
    'Replace the final source-read batch generic continuation with a manifest-neutral, source-read-specific domain operation without making core depend on CLI terminal types.',
    'Audit and normalize source-discovery blocker evidence at the filesystem adapter boundary.',
    'Run strict TypeScript and an actual PHP → CLI → manifest fixture when dependency setup permits.',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE3078_SOURCE_READ_REJECTION_INVENTORY_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
for (const [name, passed] of Object.entries(checks)) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
for (const regression of regressions) process.stdout.write(`${regression.status} ${regression.file}\n`);
process.stdout.write(`${result.status}: ${result.passed}/${result.total} structural checks passed\n`);
if (result.status !== 'PASS') process.exitCode = 1;
