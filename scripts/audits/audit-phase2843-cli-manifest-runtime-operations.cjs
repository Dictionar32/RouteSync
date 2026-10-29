'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scan = read('packages/cli/src/manifestScanOperationInterface.ts');
const composition = read('packages/cli/src/upstreamCompositionInterface.ts');
const factory = read('packages/cli/src/upstreamCompositionFactory.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const drift = read('packages/cli/src/commands/audit/driftAuditor.ts');
const manifestBuilder = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const sourceAst = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const dataflow = read('packages/core/src/types/upstream/semanticDataflow.ts');
const dataflowAuthority = read('packages/core/src/types/upstream/semanticDataflowAuthority.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['CLI scan operation is defined by a named interface', /interface RouteSyncCliManifestScanOperationInterface/.test(scan)],
  ['factory runtime export is interface-first and frozen', /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze/.test(scan)],
  ['factory delegates scan to the supplied manifest authority', /scan:\s*\(input: ControllerInvocationManifestCompositionInput\): Promise<ControllerInvocationManifest> =>\s*authority\.compose\(input\)/.test(scan)],
  ['CLI composition carries scan and request-type authorities explicitly', /manifestComposition: ControllerInvocationManifestCompositionAuthorityInterface/.test(composition) && /manifestScanOperation: RouteSyncCliManifestScanOperationInterface/.test(composition) && /requestTypeDerivationPipeline: RequestTypeDerivationSemanticPipelineInterface/.test(composition)],
  ['composition factory binds the existing scan operation factory', /manifestScanOperation:\s*routeSyncCliManifestScanOperationFactory\.create\(manifestComposition\)/.test(factory)],
  ['scan command invokes typed scan operation and typed projection pipeline', /manifestScanOperation\.scan\(/.test(cliScan) && /routeManifestProjectionCompositionFactory\.create\(requestTypeDerivationPipeline\)/.test(cliScan)],
  ['sync command invokes typed scan operation and typed projection pipeline', /manifestScanOperation\.scan\(/.test(cliSync) && /routeManifestProjectionCompositionFactory\.create\(requestTypeDerivationPipeline\)/.test(cliSync)],
  ['drift audit dispatches through the manifest judgment domain continuation', /freshManifest\.continueForDriftAudit\(/.test(drift) && !/switch\s*\(/.test(drift)],
  ['manifest builder has explicit complete and blocked ADT arms', /ManifestBuilderCompleteJudgment/.test(manifestBuilder) && /ManifestBuilderBlockedJudgment/.test(manifestBuilder) && /ManifestBuilderJudgment = ManifestBuilderCompleteJudgment \| ManifestBuilderBlockedJudgment/.test(manifestBuilder)],
  ['both manifest judgment arms carry typed follow-up operations', /interface ManifestBuilderCompleteJudgment[\s\S]*continueWith:/.test(manifestBuilder) && /interface ManifestBuilderSourceAstBlockedJudgment[\s\S]*continueWith:/.test(manifestBuilder) && /interface ManifestBuilderSourceModelBlockedJudgment[\s\S]*continueWith:/.test(manifestBuilder)],
  ['source AST projection carries a typed domain continuation', /LaravelSourceAstProjectionJudgment/.test(sourceAst) && /continueWith:/.test(sourceAst)],
  ['semantic dataflow judgment exposes domain query operations rather than reasoning label', /SemanticDataflowJudgmentOperationsInterface/.test(dataflow) && /readonly operations: SemanticDataflowJudgmentOperationsInterface/.test(dataflow) && !/interface SemanticDataflowJudgmentFixpointInterface[\s\S]*readonly reasoning:/.test(dataflow)],
  ['semantic authority binds operations to produced closure and paths', /operations:\s*Object\.freeze\(/.test(dataflowAuthority) && /containsFact:/.test(dataflowAuthority) && /reaches:/.test(dataflowAuthority) && /pathsBetween:/.test(dataflowAuthority)],
  ['upstream collections remains empty', fs.statSync(collections).size === 0],
  ['phase audit is registered in package scripts', pkg.scripts?.['audit:phase2843-cli-manifest-runtime-operations'] === 'node scripts/audits/audit-phase2843-cli-manifest-runtime-operations.cjs'],
];
let failed = false;
for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); if (!ok) failed = true; }
console.log(`Phase 2843 CLI manifest runtime operations audit: ${checks.filter(([, ok]) => ok).length}/${checks.length}`);
console.log('SCOPE: structural source assertions only; not a TypeScript build or end-to-end scan.');
if (failed) process.exitCode = 1;
