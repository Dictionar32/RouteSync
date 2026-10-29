const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const types = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const ast = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const cli = [
  read('packages/cli/src/commands/scan.ts'),
  read('packages/cli/src/commands/sync.ts'),
  read('packages/cli/src/commands/audit/driftAuditor.ts'),
];
const checks = {
  manifestOutcomeUnionIsClosed: /type ManifestBuilderJudgment\s*=\s*ManifestBuilderCompleteJudgment\s*\|\s*ManifestBuilderBlockedJudgment/.test(types),
  ASTBlockerHasOwnDiscriminator: /interface ManifestBuilderSourceAstBlocker\s*\{[\s\S]*?kind: 'manifest_builder_source_ast_blocked'/.test(types),
  sourceModelBlockerHasOwnDiscriminator: /interface ManifestBuilderSourceModelBlocker\s*\{[\s\S]*?kind: 'manifest_builder_source_model_blocked'/.test(types),
  blockedArmsRetainDistinctStagesAndTypedBlockers: /interface ManifestBuilderSourceAstBlockedJudgment\s*\{[\s\S]*?stage: 'source_ast'[\s\S]*?blocker: ManifestBuilderSourceAstBlocker/.test(types) && /interface ManifestBuilderSourceModelBlockedJudgment\s*\{[\s\S]*?stage: 'source_model'[\s\S]*?blocker: ManifestBuilderSourceModelBlocker/.test(types),
  exactNonCompleteASTJudgmentIsRetained: /projection: Exclude<LaravelSourceAstProjectionJudgment, \{ readonly kind: 'laravel_source_ast_projection_complete' \}>/.test(types) && /kind: 'manifest_builder_source_ast_blocked'[\s\S]*?projection,/.test(builder),
  sourceModelBlockerIsRetainedExactly: /sourceModel: CompleteSourceModelBuildBlockedResult/.test(types) && /kind: 'manifest_builder_source_model_blocked'[\s\S]*?sourceModel: completeLaravelSourceModelBuildResult/.test(builder),
  sourceModelBuildCannotRunBeforeCompleteAST: /if \(projection\.kind !== 'laravel_source_ast_projection_complete'\)[\s\S]*?return Object\.freeze\([\s\S]*?manifest_builder_source_ast_blocked[\s\S]*?const completeAst = projection\.completion/.test(builder),
  manifestPublicationRequiresSuccessfulSourceModel: /if \(completeLaravelSourceModelBuildResult\.kind === 'source_model_build_blocked'\)[\s\S]*?manifest_builder_source_model_blocked[\s\S]*?const dataflowInputs/.test(builder),
  ASTProjectionIsClosedOverCompleteAndBlockedOutcomes: /kind: 'laravel_source_ast_projection_complete'/.test(ast) && /kind: 'laravel_source_ast_projection_blocked'/.test(ast) && /laravel_source_ast_projection_.*_blocked/.test(ast),
  scannerPropagatesBlockedADTWithoutReclassification: /if \(judgment\.kind === 'manifest_builder_blocked'\) return judgment/.test(scanner),
  allCLICommandsGateBlockedJudgmentBeforeManifestUse: cli.every(source => /kind === 'manifest_builder_blocked'/.test(source) && /process\.exit(?:Code)?\s*=\s*1|process\.exit\(1\)/.test(source)),
  builderDoesNotConvertBlockersToEmptySuccess: !/catch\s*\([^)]*\)\s*\{[\s\S]{0,200}manifest_builder_complete/.test(builder) && !/projection\.partial[\s\S]{0,100}manifest_builder_complete/.test(builder),
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
for (const [name, passed] of Object.entries(checks)) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`Phase 2753 manifest-builder ADT repair: ${Object.keys(checks).length - failed.length}/${Object.keys(checks).length} checks passed`);
console.log('Scope: structural assertions only; semantic typecheck, unit tests, package build, and CLI E2E are separate validations.');
if (failed.length) process.exit(1);
