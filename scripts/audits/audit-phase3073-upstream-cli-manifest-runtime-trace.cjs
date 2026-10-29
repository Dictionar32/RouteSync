const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const identity = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const compositionInput = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const scanOperation = read('packages/cli/src/manifestScanOperationInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relations = path.join(root, 'packages/core/src/semantic/relations');
const checks = {
  sourceProjectIdentityIsOwnedUpstream: /export interface LaravelSourceIdentitySemanticsInterface/.test(identity) && /export const laravelSourceIdentitySemantics:\s*LaravelSourceIdentitySemanticsInterface\s*= Object\.freeze/.test(identity),
  projectIdentityFactoryIsInterfaceFirst: /export const createLaravelSourceProjectIdentity:\s*LaravelSourceProjectIdentityFactoryInterface\s*= Object\.freeze/.test(identity),
  cliScanUsesManifestScanOperation: /composition\.manifestScanOperation/.test(scan) && /manifestScanOperation\.scan\(/.test(scan),
  cliSyncUsesManifestScanOperation: /composition\.manifestScanOperation/.test(sync) && /manifestScanOperation\.scan\(/.test(sync),
  manifestScanOperationIsInterfaceFirst: /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*= Object\.freeze/.test(scanOperation),
  manifestScanOperationDelegatesToCompositionAuthority: /scan:\s*\(input: ControllerInvocationManifestCompositionInput\): Promise<ControllerInvocationManifest>\s*=>\s*authority\.compose\(input\)/.test(scanOperation),
  compositionCanonicalizesBeforeDiscovery: /input\.continueToCanonicalization\(dependencies\.sourceProjectIdentityCanonicalization/.test(composition),
  canonicalizationUsesFilesystemRealpath: /fs\.realpath\(input\.sourceProject\.root\.value\.value\)/.test(composition),
  blockedCanonicalizationPreservedAsManifestTerminal: /sourceProjectIdentityBlocked\(Object\.freeze\([\s\S]*identity:\s*blockedIdentity/.test(composition),
  completeManifestFeedsProjectionAndGenerator: /routeSyncManifestFlowProjection\.project\(completeManifest\)/.test(scan) && /manifestGeneratorOperations\.save\(resolvedManifest, outputPath\)/.test(scan),
  genericCanonicalizationContinuationStillPresentAndFlagged: /ControllerSourceProjectIdentityCanonicalizationHandlers<Result>/.test(identity) && /identity\.continueWith\(/.test(compositionInput),
  canonicalizationRetainsUnknownFailurePayload: /readonly failure: unknown/.test(identity),
  noDeletedRelationFoundationRestored: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => exists(`packages/core/src/semantic/relations/${name}`)),
  protectedCollectionsInvariantOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([name, pass]) => !pass && name !== 'genericCanonicalizationContinuationStillPresentAndFlagged');
const flagged = Object.entries(checks).filter(([name, pass]) => name === 'genericCanonicalizationContinuationStillPresentAndFlagged' && pass);
const result = {
  phase: 3073,
  title: 'Upstream → CLI → Manifest Runtime Trace and Source Project Identity Frontier',
  status: failed.length === 0 ? 'PASS_WITH_OPEN_FRONTIER' : 'FAIL',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  openFrontier: flagged.map(([name]) => ({ name, status: 'OPEN', reason: 'Canonicalization result still carries generic continueWith<Result> handlers. Keep requested/canonical identity, filesystem failure code/location, and original failure evidence while migrating to a domain-specific operation.' })),
  runtimeTrace: [
    'CLI scan/sync constructs SourceProjectIdentity from the requested project root and explicit route-source selection.',
    'RouteSyncCliManifestScanOperationInterface.scan delegates to the existing ControllerInvocationManifestCompositionAuthority.compose.',
    'Composition input owns continueToCanonicalization; the injected CLI canonicalizer calls fs.realpath on the requested root.',
    'Success reconstructs canonical SourceProjectIdentity while preserving explicit/default query-policy selection; failure retains requested identity, typed filesystem failure code/location, and original failure payload.',
    'The composition authority maps canonicalization failure to controller_invocation_manifest_source_project_identity_blocked; successful canonical identity proceeds into source discovery, source document identity/read, invocation pipeline/inventory, and ManifestBuilderJudgment.',
    'CLI scan consumes the executable manifest terminal, projects manifest flow/dataflow/graph and request-type evidence, then validates and persists the generated manifest.',
  ],
  verification: {
    structuralRuntimeTrace: failed.length === 0 ? 'PASS' : 'FAIL',
    genericCanonicalizationContinuation: 'OPEN — explicitly detected, not claimed removed',
    endToEndPhpCliManifestExecution: 'NOT_RUN',
    wholeProgramStrictTypeScript: 'NOT_CLAIMED',
    globalPrimitiveElimination: 'NOT_CLAIMED',
  },
};
const output = path.join(root, 'PHASE3073_UPSTREAM_CLI_MANIFEST_RUNTIME_TRACE_AUDIT.json');
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
for (const [name, pass] of Object.entries(checks)) console.log(`${pass ? 'PASS' : (name === 'genericCanonicalizationContinuationStillPresentAndFlagged' ? 'OPEN' : 'FAIL')} ${name}`);
console.log(`${result.status}: ${result.passed}/${result.total} checks; ${flagged.length} open migration frontier(s)`);
if (failed.length) process.exitCode = 1;
