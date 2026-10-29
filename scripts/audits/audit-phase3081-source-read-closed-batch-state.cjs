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
  const result = ts.transpileModule(read(file), { fileName: path.join(root, file), reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true } });
  return (result.diagnostics ?? []).map(d => ({ file, code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, '\n') }));
});
const checks = {
  batchAccumulatorIsClosedStateUnion: /export type PhpSourceDocumentReadOperationBatchAccumulator\s*=\s*\| PhpSourceDocumentReadOperationBatchOpenAccumulator\s*\| PhpSourceDocumentReadOperationBatchRejectedAccumulator/.test(upstream),
  openStateTransitionsToRejectedState: /includeRejected:\s*\(settlement: PhpSourceDocumentReadOperationRejectedEvidence\)\s*=>\s*PhpSourceDocumentReadOperationBatchRejectedAccumulator/.test(upstream),
  rejectedStateCannotReturnToOpen: /interface PhpSourceDocumentReadOperationBatchRejectedAccumulator\s*\{[\s\S]*?includeFulfilled:[\s\S]*?PhpSourceDocumentReadOperationBatchRejectedAccumulator[\s\S]*?includeRejected:[\s\S]*?PhpSourceDocumentReadOperationBatchRejectedAccumulator/.test(upstream),
  rejectionDecisionNotInferredFromArrayLength: !/rejected\.length\s*===\s*0/.test(upstream) && /createRejectedAccumulator/.test(upstream),
  rejectedEvidenceAndSourceIdentityPreserved: /sourceFiles,\s*rejections:\s*rejected/.test(upstream) && /preserveFailureEvidence/.test(upstream),
  settlementsContributeThroughDomainOperation: /contributeToBatch:\s*\(accumulator: PhpSourceDocumentReadOperationBatchAccumulator\): PhpSourceDocumentReadOperationBatchAccumulator => accumulator\.includeFulfilled\(evidence\)/.test(upstream) && /accumulator\.includeRejected\(settlement\)/.test(upstream),
  manifestConsumesBatchJudgmentAtExistingRuntimeBoundary: /phpSourceDocumentReadOperationBatchFactory\.fromSettlements\(settledSourceReads\)\.continueWith/.test(composition),
  interfaceFirstFactoryExport: /export const phpSourceDocumentReadOperationBatchFactory:\s*PhpSourceDocumentReadOperationBatchFactoryInterface\s*=\s*Object\.freeze/.test(upstream),
  noExportedFunctionDeclarationInChangedUpstreamFile: !/^export\s+function\s+/m.test(upstream),
  changedFilesTranspileWithoutSyntaxDiagnostics: diagnostics.length === 0,
  collectionsInvariantPreserved: collections.length === 1 && collections[0] === 10,
  deletedRelationFoundationNotRestored: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relations, name))),
};
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const result = {
  phase: 3081,
  title: 'Fully Explicit Typed Runtime Scanner Operations — closed source-read batch state',
  status: failed.length === 0 ? 'PASS_STRUCTURAL' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  syntaxDiagnostics: diagnostics,
  runtimeTrace: [
    'CLI discovered source inventory → source document reader → typed settlement operations.',
    'Fulfilled settlements preserve read order in the open batch state.',
    'The first rejected settlement transitions the accumulator to a rejected state; that state cannot transition back to open/fulfilled.',
    'The rejected state preserves every rejection and the SourceFileInventory before the existing CLI manifest terminal consumes the batch judgment.',
  ],
  verification: {
    structuralAudit: failed.length === 0 ? 'PASS' : 'FAIL',
    syntaxTranspile: diagnostics.length === 0 ? 'PASS' : 'FAIL',
    strictWholeWorkspaceTypecheck: 'NOT_RUN — dependencies/toolchain are not installed in this extracted workspace',
    fullTestSuite: 'NOT_RUN',
    phpCliManifestGeneratorEndToEnd: 'NOT_RUN',
    genericBatchContinuation: 'STILL_OPEN — retained as manifest-neutral elimination boundary',
    indexBasedSettlementTraversal: 'STILL_OPEN — intentionally not represented as solved',
  },
  nextFrontiers: [
    'Replace index-based settlement traversal with a typed sequence/cursor domain operation and prove source ordering.',
    'Replace generic final batch continuation with a manifest-neutral typed operation without importing CLI terminal types into core.',
    'Run strict TypeScript, focused source-read tests, and PHP → CLI → manifest → generator integration.',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE3081_SOURCE_READ_CLOSED_BATCH_STATE_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
for (const [name, passed] of Object.entries(checks)) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`${result.status}: ${result.passed}/${result.total} structural checks passed\n`);
if (result.status !== 'PASS_STRUCTURAL') process.exitCode = 1;
