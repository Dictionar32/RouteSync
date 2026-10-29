const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const identity = read('packages/core/src/types/upstream/phpFunctionInvocationEvidenceIdentity.ts');
const closure = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticJudgmentBatchClosureAuthority.ts');
const cli = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationFoundationPaths = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  nameSegmentIdentityRetainsTypedNameAndSourceSpan: /interface PhpFunctionInvocationNameSegmentIdentity/.test(identity) && /readonly name: FunctionName/.test(identity) && /readonly source: SourceSpan/.test(identity),
  namedIdentityRetainsPerSegmentProvenance: /readonly segments: readonly PhpFunctionInvocationNameSegmentIdentity\[\]/.test(identity) && /segmentIdentity\(segment\.name, segment\.source\)/.test(identity),
  malformedIdentityRetainsReasonAndSourceSpan: /kind: 'malformed_php_function_invocation_identity';[\s\S]*?readonly reason: 'missing_name_segment' \| 'invalid_separator_sequence';[\s\S]*?readonly source: SourceSpan/.test(identity),
  sourceSpanOperationsCompareSegmentProvenance: /sameNameSegment[\s\S]*?sourceSpanOperations\.same\(left\.source, right\.source\)/.test(identity),
  malformedIdentityEqualityIncludesSource: /left\.reason === right\.reason[\s\S]*?sourceSpanOperations\.same\(left\.source, right\.source\)/.test(identity),
  identityOperationsRemainInterfaceBacked: /export interface PhpFunctionInvocationEvidenceIdentityOperationsInterface/.test(identity) && /export const phpFunctionInvocationEvidenceIdentityOperations: PhpFunctionInvocationEvidenceIdentityOperationsInterface/.test(identity),
  duplicateCheckUsesTypedIdentityOperation: /phpFunctionInvocationEvidenceIdentityOperations\.same\(identity, evidenceIdentity\(candidate\)\)/.test(closure),
  serializedCompositeEvidenceKeyAbsent: !/const evidenceIdentity = \(evidence: PhpFunctionInvocationSourceEvidence\): string/.test(closure) && !/join\('\\\\'\)/.test(closure) && !/\u0000/.test(closure),
  cliManifestEntryRemainsInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli),
  manifestCompositionRemainsInRuntimeTrace: /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  deletedRelationFoundationsRemainAbsent: relationFoundationPaths.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3032,
  title: 'PHP Invocation Name Source-Provenance Identity — Explicit Typed ADT Operations',
  scope: 'Static contract audit that extends Phase 3031 typed invocation identity to preserve every PHP function-name segment source span and malformed-name source span. It does not claim repository-wide primitive elimination or full runtime correctness.',
  runtimePath: [
    'CLI manifest scan operation: packages/cli/src/manifestScanOperationInterface.ts',
    'Controller invocation manifest composition authority',
    'PHP invocation source inventory and semantic judgment batch closure',
    'phpFunctionInvocationEvidenceIdentityOperations creates and compares typed identity evidence',
    'Each lexical name segment and malformed syntax source span remains inspectable in the identity ADT',
    'Duplicate invocation evidence remains a rejection-ledger violation',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'SourceSpan offsets still use NumberValue as parser-boundary representation.',
    'FunctionName and source paths retain typed StringValue payloads at parser/domain boundaries.',
    'The static audit does not replace executable behavioral tests for same-name/different-span and malformed evidence cases.',
    'Full TypeScript typecheck, complete Vitest suite, and CLI-to-manifest end-to-end tests remain unverified because dependencies are unavailable in this workspace.',
    'Repository-wide removal of primitive representations and all control-flow constructs is not complete and is not claimed; parser syntax dispatch remains where it preserves closed ADT variants and evidence.',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE3032_INVOCATION_NAME_SOURCE_PROVENANCE_IDENTITY_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  console.error(`Phase 3032 audit failed: ${failed.map(([name]) => name).join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Phase 3032 audit passed: ${report.passed}/${report.total}`);
}
