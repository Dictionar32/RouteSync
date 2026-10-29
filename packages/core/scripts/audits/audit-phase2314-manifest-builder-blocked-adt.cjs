const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('src/types/upstream/manifestBuilderInterface.ts');
const builder = read('src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const cliComposition = fs.readFileSync(path.resolve(root, '../cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts'), 'utf8');
const cliScan = fs.readFileSync(path.resolve(root, '../cli/src/commands/scan.ts'), 'utf8');
const cliSync = fs.readFileSync(path.resolve(root, '../cli/src/commands/sync.ts'), 'utf8');
const cliDrift = fs.readFileSync(path.resolve(root, '../cli/src/commands/audit/driftAuditor.ts'), 'utf8');
const orchestration = read('src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const changedExecutor = [builder, read('src/compiler/scanner/orchestrator/upstreamManifestScanner.ts')].join('\n');
const checks = {
  closedCompleteAndBlockedManifestJudgment: /type ManifestBuilderJudgment\s*=\s*ManifestBuilderCompleteJudgment\s*\|\s*ManifestBuilderBlockedJudgment/.test(contract),
  blockedJudgmentRetainsExactProjection: /readonly projection:\s*Exclude<LaravelSourceAstProjectionJudgment/.test(contract),
  buildContractReturnsJudgment: /build:\s*\(\)\s*=>\s*Promise<ManifestBuilderJudgment>/.test(contract),
  blockedProjectionReturnedBeforeModelConstruction: /if \(projection\.kind !== 'laravel_source_ast_projection_complete'\)[\s\S]*?kind: 'manifest_builder_blocked'[\s\S]*?projection,[\s\S]*?const completeAst = projection\.completion/.test(builder),
  executorDoesNotThrowForProjectionBlockers: !/throw new Error\(|throw Error\(/.test(builder),
  manifestOnlyProducedForCompleteProjection: /kind: 'manifest_builder_complete'[\s\S]*?manifest: Object\.freeze\(\{[\s\S]*?kind: 'route_sync_manifest'/.test(builder),
  sourceModelBlockerReturnedBeforeDataflow: /completeLaravelSourceModelBuildResult\.kind === 'source_model_build_blocked'[\s\S]*?kind: 'manifest_builder_blocked'[\s\S]*?stage: 'source_model'[\s\S]*?inputsFromSourceModel/.test(builder),
  cliCompositionReturnsBuilderJudgment: /export type ControllerInvocationManifest\s*=\s*[\s\S]*?ManifestBuilderJudgment/.test(cliComposition),
  scanCliGatesBlockedJudgment: /scannedManifest\.kind === 'manifest_builder_blocked'/.test(cliScan),
  syncCliGatesBlockedJudgment: /scannedManifest\.kind === 'manifest_builder_blocked'/.test(cliSync),
  driftCliGatesBlockedJudgment: /freshManifest\.kind === 'manifest_builder_blocked'/.test(cliDrift),
  coreOrchestratorPropagatesBlockedJudgment: /if \(judgment\.kind === 'manifest_builder_blocked'\) return judgment/.test(orchestration),
  noFoundationOrRelationsImportInChangedExecutor: !/semantic\/(foundation|relations)/.test(changedExecutor),
};
const failed = Object.entries(checks).filter(([, passed]) => !passed);
for (const [name, passed] of Object.entries(checks)) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${Object.keys(checks).length - failed.length}/${Object.keys(checks).length} checks passed`);
if (failed.length) process.exit(1);
