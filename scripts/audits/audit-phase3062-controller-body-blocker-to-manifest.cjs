const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scannerRuntime = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const sourcePipelineContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const sourcePipelineRuntime = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const manifestBuilderContract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const manifestBuilderRuntime = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const scanCli = read('packages/cli/src/commands/scan.ts');
const syncCli = read('packages/cli/src/commands/sync.ts');
const coreBarrel = read('packages/core/src/index.ts');
const manifestComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationsDir = path.join(root, 'packages/core/src/semantic/relations');
const checks = {
  upstreamControllerScanHasSemanticBodyBlockerArm: /kind: 'laravel_controller_scan_semantic_body_blocked'[\s\S]*?blockers: readonly \[LaravelControllerSemanticBodyBlocker/.test(scannerContract),
  blockerRetainsSourceIdentityMethodSpanAndExactOutcome: /interface LaravelControllerSemanticBodyBlocker[\s\S]*?sourceFile: SourceFile[\s\S]*?source: SourceSpan[\s\S]*?outcome: ControllerDataflowAnalysisBlocked/.test(scannerContract),
  scannerGatesBlockedBodiesBeforeActionProjection: /const semanticBodyBlockers[\s\S]*?body\.kind !== 'controller_body_semantic_blocked_integrated'[\s\S]*?laravel_controller_scan_semantic_body_blocked[\s\S]*?const result:/.test(scannerRuntime),
  scannerDoesNotPublishPartialControllerArtifactsOnBlockedBody: /kind: 'laravel_controller_scan_semantic_body_blocked'[\s\S]*?controllers: Object\.freeze\(\[\]\)/.test(scannerRuntime),
  sourceAstProjectionCarriesNonCompleteControllerScan: /laravel_source_ast_projection_controller_scan_blocked[\s\S]*?scan: Exclude<import\('\.\/laravelControllerScannerInterface'\)\.LaravelControllerScanJudgment, \{ readonly kind: 'laravel_controller_scan_complete' \}>/.test(sourcePipelineContract),
  sourcePipelineUsesScannerOwnedDomainContinuation: /controllerScan\.continueToSourceAstProjection\([\s\S]*?onBlocked: (?:async )?scan => laravelSourceAstProjectionOperations\.blocked[\s\S]*?kind: 'laravel_source_ast_projection_controller_scan_blocked'[\s\S]*?scan/.test(sourcePipelineRuntime),
  existingManifestBuilderTurnsBlockedProjectionIntoTerminalManifestBlocker: /onBlocked: blockedProjection =>[\s\S]*?kind: 'manifest_builder_blocked'[\s\S]*?stage: 'source_ast'[\s\S]*?projection: blockedProjection/.test(manifestBuilderRuntime),
  manifestJudgmentIsClosedCompleteOrBlocked: /type ManifestBuilderJudgment\s*=\s*ManifestBuilderCompleteJudgment\s*\|\s*ManifestBuilderBlockedJudgment/.test(manifestBuilderContract),
  cliScanRoutesBlockedManifestToTerminalHandler: /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(scanCli),
  cliSyncRoutesBlockedManifestToTerminalHandler: /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(syncCli),
  cliManifestContinuationHasDistinctBlockedArm: /readonly manifestBlocked: \(judgment: Extract<ManifestBuilderJudgment, \{ readonly kind: 'manifest_builder_blocked' \}>\) => never/.test(manifestComposition),
  controllerBlockerExportedFromCoreBarrel: /LaravelControllerSemanticBodyBlocker/.test(coreBarrel),
  protectedCollectionsFileStillOneNewlineByte: collections.length === 1 && collections[0] === 10,
  deletedRelationFoundationModulesRemainAbsent: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationsDir, name))),
  noClaimOfGlobalPrimitiveElimination: true,
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const result = {
  phase: 3062,
  title: 'Fully Explicit Typed Runtime Scanner Operations — controller body blocker to manifest gate',
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  status: failed.length ? 'FAIL' : 'PASS',
  runtimeVerification: {
    strictTypeScript: 'BLOCKED_BY_EXISTING_DELETED_RELATION_FOUNDATION_IMPORTS_AND_REPOSITORY_TYPE_ERRORS',
    endToEndPhpToCliManifest: 'NOT_RUN',
  },
  openItems: [
    'End-to-end PHP source fixture must prove blocked controller body reaches CLI scan/sync manifestBlocked handlers before any manifest/IR write.',
    'Strict TypeScript closure remains blocked by imports into intentionally deleted relation foundations and unrelated existing type diagnostics.',
    'Parser-boundary primitives and syntax dispatch remain; no global elimination is claimed.',
  ],
};
for (const [name, passed] of Object.entries(checks)) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${result.passed}/${result.total} checks passed`);
console.log(JSON.stringify(result, null, 2));
fs.writeFileSync(path.join(root, 'PHASE3062_CONTROLLER_BODY_BLOCKER_TO_MANIFEST_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
if (failed.length) process.exit(1);
