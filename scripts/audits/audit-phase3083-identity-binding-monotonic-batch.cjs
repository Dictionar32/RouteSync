const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const files = {
  identityInterface: 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts',
  identityAuthority: 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingBatchAuthority.ts',
  frontend: 'packages/core/src/types/upstream/phpSourceFrontendInterface.ts',
  composition: 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  scan: 'packages/cli/src/commands/scan.ts',
  sync: 'packages/cli/src/commands/sync.ts',
  generator: 'packages/cli/src/generators/ManifestGenerator.ts',
};
const source = Object.fromEntries(Object.entries(files).map(([key, relative]) => [key, fs.readFileSync(path.join(root, relative), 'utf8')]));
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
const authorityJavaScript = ts.transpileModule(source.identityAuthority, {
  fileName: path.join(root, files.identityAuthority),
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
}).outputText;
const runtimeModule = { exports: {} };
new Function('exports', 'require', 'module', authorityJavaScript)(runtimeModule.exports, require, runtimeModule);
const runtimeFactory = runtimeModule.exports.phpSourceDocumentIdentityBindingBatchFactory;
const mockBound = sourceFile => Object.freeze({
  kind: 'php_source_document_identity_bound',
  requestedSourceFile: sourceFile,
  result: Object.freeze({ kind: 'mock_read_result', sourceFile }),
  continueWith: handlers => handlers.onBound(Object.freeze({
    kind: 'php_source_document_identity_bound', requestedSourceFile: sourceFile, result: Object.freeze({ kind: 'mock_read_result', sourceFile }),
  })),
});
const mockRejected = sourceFile => Object.freeze({
  kind: 'php_source_document_identity_rejected',
  requestedSourceFile: sourceFile,
  observedSourceFile: Object.freeze({ kind: 'different_source_identity' }),
  result: Object.freeze({ kind: 'mock_read_result', sourceFile }),
  continueWith: handlers => handlers.onRejected(Object.freeze({
    kind: 'php_source_document_identity_rejected', requestedSourceFile: sourceFile, observedSourceFile: Object.freeze({ kind: 'different_source_identity' }), result: Object.freeze({ kind: 'mock_read_result', sourceFile }),
  })),
});
const runtimeRejected = runtimeFactory.fromJudgments([mockBound('source-A'), mockRejected('source-B'), mockBound('source-C')]);
const runtimeEmpty = runtimeFactory.fromJudgments([]);
const runtimeBehavior = {
  rejectedBatchKeepsSuccessesBeforeAndAfterRejection: runtimeRejected.kind === 'php_source_document_identity_binding_batch_rejected' && runtimeRejected.bindings.length === 2 && runtimeRejected.readResults().length === 2,
  rejectedBatchRetainsTheRejection: runtimeRejected.kind === 'php_source_document_identity_binding_batch_rejected' && runtimeRejected.rejections.length === 1 && runtimeRejected.rejections[0].requestedSourceFile === 'source-B',
  emptyBatchRemainsBound: runtimeEmpty.kind === 'php_source_document_identity_binding_batch_bound' && runtimeEmpty.bindings.length === 0 && runtimeEmpty.readResults().length === 0,
};
const checks = {
  runtimeScenarioPreservesSuccessfulBindingsAroundRejection: runtimeBehavior.rejectedBatchKeepsSuccessesBeforeAndAfterRejection,
  runtimeScenarioRetainsRejectedIdentityEvidence: runtimeBehavior.rejectedBatchRetainsTheRejection,
  emptyBatchRemainsAnExplicitBoundOutcome: runtimeBehavior.emptyBatchRemainsBound,
  batchUsesClosedOpenAndRejectedStates: /interface IdentityBindingBatchOpenAccumulator/.test(source.identityAuthority) && /interface IdentityBindingBatchRejectedAccumulator/.test(source.identityAuthority),
  firstRejectionTransitionsOpenToRejected: /includeRejected:[\s\S]*?IdentityBindingBatchRejectedAccumulator/.test(source.identityAuthority),
  rejectedStateCannotReturnToOpen: /interface IdentityBindingBatchRejectedAccumulator\s*\{[\s\S]*?includeBound:[\s\S]*?IdentityBindingBatchRejectedAccumulator[\s\S]*?includeRejected:[\s\S]*?IdentityBindingBatchRejectedAccumulator/.test(source.identityAuthority),
  noArrayLengthClassification: !/rejections\.length\s*===\s*0/.test(source.identityAuthority) && !/rejections\.length\s*!==\s*0/.test(source.identityAuthority),
  rejectedBatchPreservesSuccessfulBindings: /interface PhpSourceDocumentIdentityBindingBatchRejectedEvidence\s*\{[\s\S]*?bindings:[\s\S]*?readResults:[\s\S]*?rejections:/.test(source.identityInterface) && /kind: 'php_source_document_identity_binding_batch_rejected',[\s\S]*?bindings,[\s\S]*?readResults: \(\) => phpSourceDocumentIdentityBindingReadResultProjection\.project\(bindings\),[\s\S]*?rejections,/.test(source.identityAuthority),
  rejectedBatchPreservesAllRejectionEvidence: /includeRejected: \(rejection: RejectedIdentity\) => createRejectedAccumulator\([\s\S]*?Object\.freeze\(\[\.\.\.rejections, rejection\]\)/.test(source.identityAuthority),
  domainJudgmentOwnsAccumulation: /for \(const judgment of judgments\)\s*\{\s*accumulator = judgment\.continueWith/.test(source.identityAuthority),
  upstreamExportIsInterfaceFirst: /export const phpSourceDocumentIdentityBindingBatchFactory:\s*PhpSourceDocumentIdentityBindingBatchFactoryInterface\s*= Object\.freeze/.test(source.identityAuthority),
  noExportedFunctionDeclarationInChangedUpstreamFiles: !/^export\s+function\s+/m.test(source.identityAuthority) && !/^export\s+function\s+/m.test(source.identityInterface),
  cliStillConsumesDomainBatchAtBoundary: /phpSourceDocumentIdentityBindingBatchFactory\.bindReads/.test(source.composition),
  cliManifestAndGeneratorPathStillPresent: /manifestScanOperation\.scan\(/.test(source.scan) && /manifestScanOperation\.scan\(/.test(source.sync) && /manifestGeneratorOperations\.save\(/.test(source.scan) && /manifestGeneratorOperations\.save\(/.test(source.sync),
  changedRuntimeFilesTranspileWithoutSyntaxDiagnostics: syntaxDiagnostics.length === 0,
  collectionsSingleNewlineInvariantPreserved: collections.length === 1 && collections[0] === 10,
  deletedRelationFoundationNotRestored: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationRoot, name))),
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3083,
  title: 'Fully Explicit Typed Runtime Scanner Operations — monotonic source identity binding batch',
  status: failed.length === 0 ? 'PASS_STRUCTURAL' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  syntaxDiagnostics,
  runtimeBehavior,
  runtimeTrace: [
    'CLI scan/sync → manifest scan operation → Laravel controller source discovery → SourceFileInventory',
    'source reader → ordered source-read settlements → closed source-read batch state',
    'fulfilled source-read batch → identity binding operation → ordered identity judgments',
    'identity judgment contribution → open identity-binding accumulator or monotonic rejected accumulator',
    'rejected identity batch preserves successful bindings/read results and all rejection evidence; it cannot become a bound batch',
    'bound identity batch → document read batch → semantic invocation pipeline → canonical manifest composition → contract validation → manifest generator save',
  ],
  verification: {
    structuralAudit: failed.length === 0 ? 'PASS' : 'FAIL',
    syntaxTranspile: syntaxDiagnostics.length === 0 ? 'PASS' : 'FAIL',
    strictWholeWorkspaceTypecheck: 'BLOCKED — focused tsc follows the workspace import graph into pre-existing unresolved deleted-relation imports and the protected collections.ts module invariant; no diagnostics remain in the two changed identity-binding files.',
    focusedTests: 'NOT_RUN',
    phpCliManifestGeneratorEndToEnd: 'NOT_RUN',
    remainingFrontier: 'Generic continuation contracts remain elsewhere in the upstream ADTs; this phase does not claim workspace-wide primitive elimination.',
  },
  nextFrontiers: [
    'Trace field-level source provenance through identity binding, document batches, semantic invocation, manifest projection, and canonical JSON.',
    'Review generic continuations in upstream ADTs one domain at a time; replace only when an explicit domain operation preserves ownership and type evidence.',
    'Run strict TypeScript, focused tests, and PHP → CLI → manifest → generator integration in a fully installed workspace.',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE3083_IDENTITY_BINDING_MONOTONIC_BATCH_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of Object.entries(checks)) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`${report.status}: ${report.passed}/${report.total} structural checks passed\n`);
if (report.status !== 'PASS_STRUCTURAL') process.exitCode = 1;
