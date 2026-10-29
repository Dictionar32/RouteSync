const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const provenance = read('packages/core/src/types/upstream/provenance.ts');
const inventory = read('packages/core/src/types/upstream/phpFunctionResolutionSourceInventoryAuthority.ts');
const environment = read('packages/core/src/types/upstream/phpFunctionResolutionEnvironmentProjectionAuthority.ts');
const occurrence = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceOccurrenceVerification.ts');
const policy = read('packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts');
const tests = read('packages/core/src/types/upstream/__tests__/sourceSpanDomainOperations.phase3026.test.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationFoundationPaths = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const checks = {
  overlapIsExplicitDomainJudgment: /export type SourceSpanOverlap/.test(provenance) && /readonly overlaps: \(left: SourceSpan, right: SourceSpan\) => SourceSpanOverlap/.test(provenance) && /source_span_overlapping/.test(provenance),
  regionOverlapDelegatesToSourceSpanOperations: /sourceSpanOperations\.overlaps\(left\.region\.source, right\.region\.source\)/.test(inventory) && !/left\.region\.source\.start\.value\s*</.test(inventory),
  environmentProjectionUsesNonEmptySpanAndContainmentOperations: /sourceSpanOperations\.validateNonEmpty/.test(environment) && /sourceSpanOperations\.contains/.test(environment) && !/span\.start\.value\s*>?=/.test(environment),
  sourceOccurrenceMembershipUsesCanonicalSpanEquality: (occurrence.match(/sourceSpanOperations\.same\(/g) || []).length >= 5,
  effectivePolicySourceEqualityUsesDomainOperation: /sourceSpanOperations\.same\(left\.source, right\.source\)/.test(policy),
  overlapCasesCoveredByTests: /sourceSpanOperations\.overlaps\(span\(0, 5\), span\(4, 9\)\)/.test(tests) && /source_span_overlap_invalid/.test(tests),
  removedRelationFoundationsRemainAbsent: relationFoundationPaths.every(relative => !exists(relative)),
  collectionsSentinelRemainsOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const report = {
  phase: 3027,
  title: 'SourceSpan Consumer Domain Migration — Runtime Evidence Trace',
  scope: 'Static contract audit; it verifies selected runtime consumers delegate source-span equality, containment, and overlap semantics to upstream domain operations.',
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  remainingDebt: [
    'SourceSpan still stores NumberValue offsets as parser-boundary representation; this phase centralizes selected consumer semantics but does not eliminate numeric representation.',
    'Some producers and consumers outside the selected scope still construct or compare source coordinates directly.',
    'Raw PHP parser offsets remain primitive at the parser boundary by design; semantic operations should not re-derive source-span meaning downstream.',
    'String/number/undefined/null/boolean elimination, reduce/empty-array/nullish/ternary cleanup, and all exported-function conversion remain repository-wide work.',
    'Full typecheck, test suite, and CLI-to-manifest end-to-end validation are not claimed by this static audit.'
  ],
};
fs.writeFileSync(path.join(root, 'PHASE3027_SOURCE_SPAN_CONSUMER_DOMAIN_MIGRATION_AUDIT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  console.error(`Phase 3027 audit failed: ${failed.map(([name]) => name).join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Phase 3027 audit passed: ${report.passed}/${report.total}`);
}
