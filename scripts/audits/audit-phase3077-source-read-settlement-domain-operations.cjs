const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
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
    fileName: path.join(root, file),
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
  });
  return (result.diagnostics ?? []).map(d => ({ file, code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') }));
});
const checks = {
  settlementHandlersGenericContractRemoved: !/interface PhpSourceDocumentReadOperationSettlementHandlers<Result>/.test(upstream),
  settlementExposesTypedDomainOperation: /interface PhpSourceDocumentReadOperationSettlementDomainOperations\s*\{\s*readonly contributeToBatch:\s*\(accumulator:\s*PhpSourceDocumentReadOperationBatchAccumulator\)/.test(upstream),
  batchAccumulatorOwnsDomainActions: /interface PhpSourceDocumentReadOperationBatchAccumulator\s*\{[\s\S]*?includeFulfilled:[\s\S]*?includeRejected:[\s\S]*?finish:/.test(upstream),
  fulfilledSettlementContributesAsFulfilled: /contributeToBatch:\s*\(accumulator:\s*PhpSourceDocumentReadOperationBatchAccumulator\):\s*PhpSourceDocumentReadOperationBatchAccumulator\s*=>\s*accumulator\.includeFulfilled\(evidence\)/.test(upstream),
  rejectedSettlementContributesAsRejected: /contributeToBatch:\s*\(accumulator:\s*PhpSourceDocumentReadOperationBatchAccumulator\):\s*PhpSourceDocumentReadOperationBatchAccumulator\s*=>\s*accumulator\.includeRejected\(settlement\)/.test(upstream),
  batchFactoryConsumesDomainOperation: /consume\s*=\s*\(index:\s*number,\s*accumulator:\s*PhpSourceDocumentReadOperationBatchAccumulator\)[\s\S]*?settlements\[index\]!\.contributeToBatch\(accumulator\)/.test(upstream),
  rejectedIdentityAndEvidencePreserved: /readonly sourceFile:\s*SourceFile[\s\S]*?readonly failure:\s*PhpSourceDocumentReadFailureEvidence[\s\S]*?preserveFailureEvidence/.test(upstream) && /rejections:\s*rejected/.test(upstream),
  manifestConsumesBatchOutcomesWithoutSettlementChanges: /phpSourceDocumentReadOperationBatchFactory\.fromSettlements\(settledSourceReads\)\.continueWith/.test(composition) && /sourceDocumentReadOperationRejected\([\s\S]*?rejections:\s*rejectedBatch\.rejections/.test(composition),
  canonicalExportRemainsInterfaceFirst: /export const phpSourceDocumentReadOperationSettlementFactory:\s*PhpSourceDocumentReadOperationSettlementFactoryInterface\s*=\s*Object\.freeze/.test(upstream),
  noExportedFunctionDeclarationInChangedUpstreamFile: !/^export\s+function\s+/m.test(upstream),
  protectedCollectionsInvariantOneNewlineByte: collections.length === 1 && collections[0] === 10,
  deletedRelationFoundationRemainsAbsent: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relations, name))),
  changedFilesTranspileWithoutSyntaxDiagnostics: diagnostics.length === 0,
};
const regressions = [
  ['phase3076', 'PHASE3076_AUDIT.log'],
  ['phase3075', 'PHASE3075_AUDIT.log'],
  ['phase3074', 'PHASE3074_AUDIT.log'],
  ['phase3072', 'PHASE3072_AUDIT.log'],
].map(([phase, file]) => ({ phase, status: fs.existsSync(path.join(root, file)) ? 'ARTIFACT_PRESENT' : 'NOT_RUN', output: '' }));
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const result = {
  phase: 3077,
  title: 'Fully Explicit Typed Runtime Scanner Operations — source read settlement domain operations',
  status: failed.length === 0 ? 'PASS' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  syntaxDiagnostics: diagnostics,
  regressions,
  runtimeTrace: [
    'CLI scan/sync composition awaits source read settlements from the discovered source inventory.',
    'Each fulfilled or rejected settlement contributes to a source-read-owned typed batch accumulator through contributeToBatch.',
    'The accumulator creates either a fulfilled batch preserving read order or a rejected batch preserving all rejected source identities and normalized failure evidence.',
    'The CLI manifest composition still consumes the final batch judgment and routes rejected batches to the blocked manifest terminal.',
  ],
  verification: {
    structuralAudit: failed.length === 0 ? 'PASS' : 'FAIL',
    changedFileSyntaxTranspile: diagnostics.length === 0 ? 'PASS' : 'FAIL',
    priorAuditArtifacts: regressions.every(item => item.status === 'ARTIFACT_PRESENT') ? 'PRESENT' : 'INCOMPLETE — artifact presence is not a rerun of the regression audit',
    wholeWorkspaceStrictTypeScript: 'NOT_CLAIMED',
    endToEndPhpCliManifestExecution: 'NOT_RUN',
    globalPrimitiveElimination: 'NOT_CLAIMED — index-based collection traversal and the final batch judgment continuation remain outside this phase scope.',
  },
  remainingFrontiers: [
    'The final batch judgment still exposes generic continueWith handlers; migrate it separately to a manifest-neutral domain outcome operation.',
    'Source discovery blocker evidence still includes unknown platform failure payloads; normalize at the filesystem adapter boundary before the upstream discovery ADT.',
    'Run strict TypeScript and an actual PHP → CLI → manifest fixture when the workspace dependency setup supports them.',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE3077_SOURCE_READ_SETTLEMENT_DOMAIN_OPERATIONS_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
for (const [name, passed] of Object.entries(checks)) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
for (const regression of regressions) process.stdout.write(`${regression.status} ${regression.phase} audit artifact\n`);
process.stdout.write(`${result.status}: ${result.passed}/${result.total} structural checks passed\n`);
if (result.status !== 'PASS') process.exitCode = 1;
