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
  identityIsClosedTypedAdt: /export type PhpFunctionInvocationNameIdentity\s*=/.test(identity) && /named_php_function_invocation_identity/.test(identity) && /malformed_php_function_invocation_identity/.test(identity),
  identityOperationsAreInterfaceBacked: /export interface PhpFunctionInvocationEvidenceIdentityOperationsInterface/.test(identity) && /export const phpFunctionInvocationEvidenceIdentityOperations: PhpFunctionInvocationEvidenceIdentityOperationsInterface/.test(identity),
  identityRetainsSourceSpanAndSyntaxNameEvidence: /readonly source: SourceSpan/.test(identity) && /readonly name: PhpFunctionInvocationNameIdentity/.test(identity) && /PhpFunctionNameSyntaxEvidence/.test(identity),
  identityUsesCanonicalSourceSpanEquality: /sourceSpanOperations\.same\(left\.source, right\.source\)/.test(identity),
  duplicateCheckUsesTypedIdentityOperation: /phpFunctionInvocationEvidenceIdentityOperations\.same\(identity, evidenceIdentity\(candidate\)\)/.test(closure),
  serializedEvidenceKeyRemoved: !/const evidenceIdentity = \(evidence: PhpFunctionInvocationSourceEvidence\): string/.test(closure) && !/join\('\\\\'\)/.test(closure) && !/\\u0000/.test(closure),
  invocationBatchClosureKeepsTypedDomainIdentity: /phpFunctionInvocationEvidenceIdentityOperations\.create/.test(closure),
  cliManifestEntryRemainsInterfaceBacked: /export const routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface/.test(cli),
  manifestCompositionRemainsInRuntimeTrace: /ControllerInvocationManifestCompositionAuthorityInterface/.test(composition),
  deletedRelationFoundationsRemainAbsent: relationFoundationPaths.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3031,
  title: 'PHP Invocation Evidence Identity — Explicit Typed ADT Operations',
  scope: 'Static contract audit for replacing the invocation closure string-serialized identity key with a typed upstream identity ADT. Confirms source-span identity and name/malformed-syntax evidence remain separately inspectable; does not claim repository-wide primitive elimination or full runtime correctness.',
  runtimePath: [
    'CLI manifest scan operation: packages/cli/src/manifestScanOperationInterface.ts',
    'Controller invocation manifest composition authority',
    'PHP invocation source inventory and semantic judgment batch closure',
    'phpFunctionInvocationEvidenceIdentityOperations creates and compares typed identity evidence',
    'Duplicate invocation evidence remains a rejection-ledger violation; source inventory and judgment closure are unchanged',
  ],
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'SourceSpan offsets still use NumberValue as parser-boundary representation; this phase does not eliminate numeric primitives from the repository.',
    'The identity operation compares typed StringValue payloads at the domain boundary; no delimiter-based serialized composite key remains.',
    'Syntax dispatch and sequence/collection operations remain where they preserve parser evidence and closure semantics; no mechanical rewrite of if, switch, arrays, nullish coalescing, or ternaries is claimed.',
    'Repository-wide removal of string, number, undefined, null, boolean, reduce, empty arrays, nullish coalescing, ternaries, and exported function declarations is not complete and is not claimed.',
    'Full TypeScript typecheck, complete Vitest suite, and CLI-to-manifest end-to-end tests were not run because dependencies are unavailable in this workspace.',
  ],
};
fs.writeFileSync(path.join(root, 'PHASE3031_INVOCATION_EVIDENCE_IDENTITY_ADT_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  console.error(`Phase 3031 audit failed: ${failed.map(([name]) => name).join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Phase 3031 audit passed: ${report.passed}/${report.total}`);
}
