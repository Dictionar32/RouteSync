const fs = require('node:fs');
const path = require('node:path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js');
const root = path.resolve(__dirname, '../..');
const files = {
  identityInterface: 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts',
  identityAuthority: 'packages/core/src/types/upstream/phpSourceDocumentIdentityBindingBatchAuthority.ts',
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
const readResult = label => Object.freeze({ kind: 'read-result', label });
const bound = (label, result) => Object.freeze({
  kind: 'php_source_document_identity_bound',
  requestedSourceFile: label,
  result,
  continueWith: handlers => handlers.onBound(Object.freeze({ kind: 'php_source_document_identity_bound', requestedSourceFile: label, result })),
});
const rejected = label => Object.freeze({
  kind: 'php_source_document_identity_rejected',
  requestedSourceFile: label,
  observedSourceFile: `observed-${label}`,
  result: readResult(`rejected-${label}`),
  continueWith: handlers => handlers.onRejected(Object.freeze({ kind: 'php_source_document_identity_rejected', requestedSourceFile: label, observedSourceFile: `observed-${label}`, result: readResult(`rejected-${label}`) })),
});
const firstResult = readResult('first');
const lastResult = readResult('last');
const runtimeRejected = runtimeFactory.fromJudgments([bound('A', firstResult), rejected('B'), bound('C', lastResult)]);
const runtimeEmpty = runtimeFactory.fromJudgments([]);
const projected = runtimeRejected.readResults();
const runtimeBehavior = {
  projectionPreservesBoundReadOrder: projected.length === 2 && projected[0] === firstResult && projected[1] === lastResult,
  projectionIsFreshDerivedOutput: projected !== runtimeRejected.bindings && Object.isFrozen(projected),
  rejectionEvidenceAndSuccessfulBindingsCoexist: runtimeRejected.kind === 'php_source_document_identity_binding_batch_rejected' && runtimeRejected.bindings.length === 2 && runtimeRejected.rejections.length === 1,
  emptyBoundBatchProjectsAnEmptyInventory: runtimeEmpty.kind === 'php_source_document_identity_binding_batch_bound' && runtimeEmpty.readResults().length === 0,
};
const checks = {
  readResultsIsAnOperationNotDuplicatedStoredField: /readonly readResults:\s*\(\) => readonly PhpSourceDocumentReadResult\[\]/.test(source.identityInterface),
  bindingsRemainTheStoredSourceOfTruth: /readonly bindings:\s*readonly PhpSourceDocumentIdentityBoundEvidence\[\]/.test(source.identityInterface),
  derivedProjectionUsesExplicitTypedSequence: /export const phpSourceDocumentIdentityBindingReadResultProjection:\s*PhpSourceDocumentIdentityBindingReadResultProjectionInterface\s*= Object\.freeze\([\s\S]*?project:\s*\(bindings:[\s\S]*?Object\.freeze\(readResults\)/.test(source.identityAuthority),
  upstreamProjectionHasNoMap: !/\.map\s*\(/.test(source.identityAuthority),
  successfulBatchUsesDerivedProjection: /readResults:\s*\(\) => phpSourceDocumentIdentityBindingReadResultProjection\.project\(bindings\)/.test(source.identityAuthority),
  rejectedBatchUsesSameDerivedProjection: (source.identityAuthority.match(/readResults:\s*\(\) => phpSourceDocumentIdentityBindingReadResultProjection\.project\(bindings\)/g) || []).length === 2,
  cliConsumesProjectionOperation: /fromResults\(boundBatch\.readResults\(\)\)/.test(source.composition),
  batchStillPreservesMonotonicRejectionState: /interface IdentityBindingBatchRejectedAccumulator\s*\{[\s\S]*?includeBound:[\s\S]*?IdentityBindingBatchRejectedAccumulator[\s\S]*?includeRejected:[\s\S]*?IdentityBindingBatchRejectedAccumulator/.test(source.identityAuthority),
  noArrayLengthClassification: !/rejections\.length\s*(?:===|!==)\s*0/.test(source.identityAuthority),
  runtimeProjectionPreservesOrderAndIdentity: runtimeBehavior.projectionPreservesBoundReadOrder,
  runtimeProjectionIsDerivedAndImmutable: runtimeBehavior.projectionIsFreshDerivedOutput,
  runtimeRejectionAndSuccessEvidenceCoexist: runtimeBehavior.rejectionEvidenceAndSuccessfulBindingsCoexist,
  emptyBatchProjectionRemainsTyped: runtimeBehavior.emptyBoundBatchProjectsAnEmptyInventory,
  cliManifestGeneratorPathRemainsConnected: /manifestScanOperation\.scan\(/.test(source.scan) && /manifestScanOperation\.scan\(/.test(source.sync) && /manifestGeneratorOperations\.save\(/.test(source.scan) && /manifestGeneratorOperations\.save\(/.test(source.sync),
  interfaceFirstFactoryExportPreserved: /export const phpSourceDocumentIdentityBindingBatchFactory:\s*PhpSourceDocumentIdentityBindingBatchFactoryInterface\s*= Object\.freeze/.test(source.identityAuthority),
  changedFilesTranspileWithoutSyntaxDiagnostics: syntaxDiagnostics.length === 0,
  collectionsSingleNewlineInvariantPreserved: collections.length === 1 && collections[0] === 10,
  deletedRelationFoundationNotRestored: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationRoot, name))),
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3084,
  title: 'Fully Explicit Typed Runtime Scanner Operations — derived read-result projection',
  status: failed.length === 0 ? 'PASS_STRUCTURAL' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  runtimeBehavior,
  syntaxDiagnostics,
  runtimeTrace: [
    'CLI scan/sync → manifest scan operation → Laravel controller source discovery → source-read settlements',
    'source-read settlement batch → monotonic source identity binding judgment',
    'identity batch stores bound identity evidence once; readResults() derives an immutable ordered projection from bindings',
    'CLI consumes the domain projection → document-read batch → semantic invocation → manifest composition and validation → canonical manifest generator save',
  ],
  verification: {
    structuralAudit: failed.length === 0 ? 'PASS' : 'FAIL',
    focusedRuntimeProjectionScenarios: Object.values(runtimeBehavior).every(Boolean) ? 'PASS' : 'FAIL',
    syntaxTranspile: syntaxDiagnostics.length === 0 ? 'PASS' : 'FAIL',
    strictWholeWorkspaceTypecheck: 'ATTEMPTED — blocked by pre-existing unresolved deleted-relation imports, protected collections.ts module invariant, and missing Node/@routesync/core type declarations; no diagnostics were reported directly in the two changed upstream identity-binding files.',
    fullTestSuite: 'NOT_RUN',
    phpCliManifestGeneratorEndToEnd: 'NOT_RUN',
    scope: 'Removes the duplicated stored readResults field and map projection from the identity-binding authority. Does not claim workspace-wide removal of map, primitive types, or control flow.',
  },
  nextFrontier: 'Trace source/evidence provenance field-by-field through semantic invocation and canonical manifest JSON; review each remaining collection projection under its domain owner.',
};
fs.writeFileSync(path.join(root, 'PHASE3084_DERIVED_READ_RESULT_PROJECTION_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
for (const [name, passed] of Object.entries(checks)) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`${report.status}: ${report.passed}/${report.total} structural checks passed\n`);
if (report.status !== 'PASS_STRUCTURAL') process.exitCode = 1;
