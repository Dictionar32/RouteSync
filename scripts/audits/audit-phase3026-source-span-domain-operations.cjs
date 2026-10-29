const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const provenance = read('packages/core/src/types/upstream/provenance.ts');
const validation = read('packages/core/src/types/upstream/phpSourceFrontendExtractionValidationAuthority.ts');
const inventory = read('packages/core/src/types/upstream/phpFunctionResolutionSourceInventoryAuthority.ts');
const routeAdapter = read('packages/core/src/compiler/frontend/php/routeAst/phpControllerDataflowSourcePayloadEvidenceAdapter.ts');
const cliAdapter = read('packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts');
const test = read('packages/core/src/types/upstream/__tests__/sourceSpanDomainOperations.phase3026.test.ts');
const relationFoundationPaths = [
  'packages/core/src/semantic/relations/relationMembership.ts',
  'packages/core/src/semantic/relations/relationalSequence.ts',
  'packages/core/src/semantic/relations/semanticRelations.ts',
];
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = {
  sourceSpanHasNamedDomainContract: /export interface SourceSpanOperationsInterface/.test(provenance) && /export const sourceSpanOperations:\s*SourceSpanOperationsInterface\s*=\s*Object\.freeze/.test(provenance),
  comparisonsReturnClosedJudgments: /SourceSpanEquality/.test(provenance) && /SourceSpanValidity/.test(provenance) && /SourceSpanContainment/.test(provenance) && /SourceSpanDocumentCoverage/.test(provenance),
  spanFactoryIsInterfaceBacked: /export interface SourceSpanFactoryInterface/.test(provenance) && /export const sourceSpanFactory:\s*SourceSpanFactoryInterface/.test(provenance),
  sourceValidationDelegatesDomainSemantics: /sourceSpanOperations\.same/.test(validation) && /sourceSpanOperations\.validate/.test(validation) && /sourceSpanOperations\.contains/.test(validation),
  functionResolutionInventoryDelegatesDomainSemantics: /sourceSpanOperations\.same/.test(inventory) && /sourceSpanOperations\.validate/.test(inventory) && /sourceSpanOperations\.contains/.test(inventory),
  routePayloadAdapterUsesTypedSpanFactory: /sourceSpanFactory\.create/.test(routeAdapter) && !/kind: 'source_span',[\s\S]*?start: numberValue\(value\.source\.startOffset\)/.test(routeAdapter),
  cliPhpAdapterUsesTypedSpanFactory: /sourceSpanFactory\.create/.test(cliAdapter) && /sourceSpanFactory/.test(read('packages/core/src/index.ts')),
  testsCoverEqualityValidityContainmentAndCoverage: /explicit equality judgments/.test(test) && /source-boundary validity/.test(test) && /judges containment/.test(test),
  removedRelationFoundationsRemainAbsent: relationFoundationPaths.every(file => !exists(file)),
  collectionsSentinelRemainsOneNewlineByte: fs.existsSync(collections) && fs.statSync(collections).size === 1 && fs.readFileSync(collections).equals(Buffer.from('\n')),
};
const report = {
  phase: 3026,
  title: 'SourceSpan Domain Operations — Upstream Runtime Evidence Slice',
  scope: 'Static contract audit. Typecheck and Vitest execution require project dependencies not installed in this workspace runtime.',
  checks,
  remainingDebt: [
    'SourceSpan retains NumberValue fields as parser/serialization boundary evidence for compatibility; direct offset comparisons remain elsewhere and need consumer-by-consumer migration.',
    'SourceSpan constructors in other scanner producers and fixtures have not all been migrated to sourceSpanFactory.',
    'StatementIndex ordinal remains numeric boundary evidence; name factories still accept raw strings; numberValue/truthValue remain function-valued exports.',
    'Repository-wide primitive checks, nullish fallbacks, ternaries, reductions, empty-array defaults, and parser traversal arithmetic are not globally removed.',
    'No full typecheck, test suite, or CLI-to-manifest end-to-end run was possible because node_modules is absent.'
  ]
};
console.log(JSON.stringify(report, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;
