const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const files = {
  upstream: 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts',
  composition: 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  scan: 'packages/cli/src/commands/scan.ts',
  sync: 'packages/cli/src/commands/sync.ts',
  generator: 'packages/cli/src/generators/ManifestGenerator.ts',
  validator: 'packages/cli/src/generators/ManifestContractValidator.ts',
};
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const source = Object.fromEntries(Object.entries(files).map(([key, relative]) => [key, read(relative)]));
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationRoot = path.join(root, 'packages/core/src/semantic/relations');
const syntaxDiagnostics = Object.entries(files).flatMap(([key, relative]) => {
  const result = ts.transpileModule(source[key], {
    fileName: path.join(root, relative),
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
  });
  return (result.diagnostics ?? []).map(diagnostic => ({
    file: relative,
    code: diagnostic.code,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
  }));
});
const checks = {
  settlementTraversalUsesDomainContributionInStableSequence: /for\s*\(const settlement of settlements\)\s*\{\s*accumulator = settlement\.contributeToBatch\(accumulator\);\s*\}/.test(source.upstream),
  settlementTraversalHasNoIndexArithmetic: !/settlements\s*\[\s*index\s*\]/.test(source.upstream) && !/index\s*\+\s*1/.test(source.upstream),
  documentReadTraversalUsesResultOwnedJudgment: /for\s*\(const result of results\)\s*\{\s*accumulator = result\.continueWith/.test(source.upstream),
  documentReadTraversalHasNoIndexArithmetic: !/results\s*\[\s*index\s*\]/.test(source.upstream) && !/index\s*\+\s*1/.test(source.upstream),
  rejectedStateRemainsMonotonic: /interface PhpSourceDocumentReadOperationBatchRejectedAccumulator\s*\{[\s\S]*?includeFulfilled:[\s\S]*?PhpSourceDocumentReadOperationBatchRejectedAccumulator[\s\S]*?includeRejected:[\s\S]*?PhpSourceDocumentReadOperationBatchRejectedAccumulator/.test(source.upstream),
  rejectionEvidenceAndSourceIdentityRemainPresent: /sourceFiles,\s*rejections:\s*rejected/.test(source.upstream) && /preserveFailureEvidence/.test(source.upstream),
  cliUsesUpstreamManifestScanOperation: /manifestScanOperation\.scan\(/.test(source.scan) && /manifestScanOperation\.scan\(/.test(source.sync),
  compositionUsesSourceReadBatchDomain: /phpSourceDocumentReadOperationBatchFactory\.fromSettlements\(settledSourceReads\)\.continueWith/.test(source.composition),
  cliValidatesAndPersistsCanonicalManifest: /manifestContractValidationOperations\.validate\(resolvedManifest\)/.test(source.scan) && /manifestGeneratorOperations\.save\(resolvedManifest, outputPath\)/.test(source.scan) && /manifestContractValidationOperations\.validate\(resolvedManifest\)/.test(source.sync) && /manifestGeneratorOperations\.save\(resolvedManifest, localManifestPath\)/.test(source.sync),
  manifestPersistenceIsInterfaceFirst: /export const manifestGeneratorOperations:\s*ManifestGeneratorOperationsInterface\s*=\s*Object\.freeze/.test(source.generator),
  noExportedFunctionDeclarationInUpstreamFrontend: !/^export\s+function\s+/m.test(source.upstream),
  changedRuntimeFilesTranspileWithoutSyntaxDiagnostics: syntaxDiagnostics.length === 0,
  collectionsSingleNewlineInvariantPreserved: collections.length === 1 && collections[0] === 10,
  deletedRelationFoundationNotRestored: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationRoot, name))),
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3082,
  title: 'Fully Explicit Typed Runtime Scanner Operations — typed source-read sequence traversal',
  status: failed.length === 0 ? 'PASS_STRUCTURAL' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  syntaxDiagnostics,
  runtimeTrace: [
    'scan/sync command → RouteSyncCliManifestScanOperationInterface.scan',
    'upstream composition → Laravel controller source discovery → SourceFileInventory',
    'discoveredSourceReadSettlementOperation.readAll → Promise.all settlement inventory in scheduled source order',
    'PhpSourceDocumentReadOperationSettlement.contributeToBatch → closed open/rejected batch state; traversal uses ordered sequence iteration without exposed index arithmetic',
    'batch judgment → source identity binding → PhpSourceDocumentReadBatchFactory.fromResults; each result ADT owns complete/blocked classification while ordered iteration accumulates domain state',
    'complete documents → semantic invocation pipeline → manifest builder/projection → CLI manifest contract validation → manifestGeneratorOperations.save',
    'sync additionally emits invocation, request evidence, dataflow and IR artifacts; these are additive to canonical manifest JSON persistence',
  ],
  verification: {
    structuralAudit: failed.length === 0 ? 'PASS' : 'FAIL',
    syntaxTranspile: syntaxDiagnostics.length === 0 ? 'PASS' : 'FAIL',
    strictWholeWorkspaceTypecheck: 'NOT_RUN — dependency/toolchain availability is not established by syntax transpilation',
    focusedTests: 'NOT_RUN',
    phpCliManifestGeneratorEndToEnd: 'NOT_RUN',
    genericBatchContinuation: 'OPEN — next frontier; core must remain CLI-manifest-neutral',
    primitiveControlFlow: 'REDUCED AT TWO SOURCE-READ BATCH TRAVERSAL SITES; no claim of workspace-wide elimination',
  },
  nextFrontiers: [
    'Replace the generic final batch continuation with explicit manifest-neutral domain operations while preserving CLI ownership of terminal outcomes.',
    'Trace field-level provenance from source scanner evidence to canonical manifest JSON and generator consumers.',
    'Run strict TypeScript, focused tests, and PHP → CLI → manifest → generator integration in a fully installed workspace.',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE3082_TYPED_SOURCE_READ_SEQUENCE_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of Object.entries(checks)) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`${report.status}: ${report.passed}/${report.total} structural checks passed\n`);
if (report.status !== 'PASS_STRUCTURAL') process.exitCode = 1;
