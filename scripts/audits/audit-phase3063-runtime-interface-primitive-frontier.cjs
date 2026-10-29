const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanCli = read('packages/cli/src/commands/scan.ts');
const syncCli = read('packages/cli/src/commands/sync.ts');
const scannerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const scannerRuntime = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const pipelineContract = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const pipelineRuntime = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const manifestContract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const manifestRuntime = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const cliComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationsDir = path.join(root, 'packages/core/src/semantic/relations');
const firstOutput = source => Math.min(...['writeFileSync(', 'writeJson(', 'manifestGeneratorOperations.save('].map(token => {
  const index = source.indexOf(token);
  return index < 0 ? Number.POSITIVE_INFINITY : index;
}));
const scanGate = scanCli.indexOf('const completeManifest = scannedManifest.continueForDriftAudit');
const syncGate = syncCli.indexOf('const completeManifest = scannedManifest.continueForDriftAudit');
const checks = {
  controllerScannerContractIsExplicitUpstreamInterface: /export interface LaravelControllerScannerInterface/.test(scannerContract) && /readonly scan:/.test(scannerContract),
  controllerScannerProducesTypedBodyBlockerWithProvenance: /LaravelControllerSemanticBodyBlocker/.test(scannerContract) && /outcome: ControllerDataflowAnalysisBlocked/.test(scannerContract),
  controllerScannerBlocksBeforeActionProjection: /if \(semanticBodyBlockers\.length > 0\)[\s\S]*?laravel_controller_scan_semantic_body_blocked[\s\S]*?controllers: Object\.freeze\(\[\]\)/.test(scannerRuntime),
  scannerOutcomeADTProvidesDomainContinuation: /export type LaravelControllerScanJudgment = LaravelControllerScanCompleteJudgment \| LaravelControllerScanBlockedJudgment/.test(scannerContract) && /continueToSourceAstProjection/.test(scannerContract),
  scannerProducerUsesTypedOutcomeConstructors: /laravelControllerScanJudgmentOperations\.blocked/.test(scannerRuntime) && /laravelControllerScanJudgmentOperations\.complete/.test(scannerRuntime),
  sourceAstPipelineUsesUpstreamScannerContinuation: /controllerScan\.continueToSourceAstProjection\([\s\S]*?onBlocked: (?:async )?scan => laravelSourceAstProjectionOperations\.blocked[\s\S]*?laravel_source_ast_projection_controller_scan_blocked/.test(pipelineRuntime) && /continueToSourceAstProjection/.test(scannerContract),
  sourceAstProjectionPreservesBlockedScannerOutcome: /laravel_source_ast_projection_controller_scan_blocked[\s\S]*?scan: Exclude<import\('\.\/laravelControllerScannerInterface'\)\.LaravelControllerScanJudgment/.test(pipelineContract),
  manifestBuilderHasClosedCompleteBlockedJudgment: /ManifestBuilderCompleteJudgment \| ManifestBuilderBlockedJudgment/.test(manifestContract) && /kind: 'manifest_builder_blocked'/.test(manifestRuntime),
  manifestBuilderDoesNotContinueIntoSourceModelOnBlockedSourceAst: /onBlocked: blockedProjection =>[\s\S]*?kind: 'manifest_builder_blocked'[\s\S]*?onComplete: async completeProjection/.test(manifestRuntime),
  cliScanTerminalManifestGatePrecedesEveryManifestOrIrWrite: scanGate >= 0 && scanGate < firstOutput(scanCli) && /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(scanCli),
  cliSyncTerminalManifestGatePrecedesEveryManifestOrIrWrite: syncGate >= 0 && syncGate < firstOutput(syncCli) && /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(syncCli),
  terminalManifestJudgmentOwnsDomainContinuation: /continueForDriftAudit: handlers => handlers\.manifestBlocked\(judgment\)/.test(cliComposition) && /fromManifestBuilderJudgment: judgment => judgment\.continueWith/.test(cliComposition),
  noRelationFoundationRestoration: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationsDir, name))),
  protectedCollectionsInvariantPreserved: collections.length === 1 && collections[0] === 10,
};
const runtimeFiles = {
  controllerScannerContract: 'packages/core/src/types/upstream/laravelControllerScannerInterface.ts',
  controllerScannerRuntime: 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts',
  sourceAstPipelineContract: 'packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts',
  sourceAstPipelineRuntime: 'packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts',
  manifestBuilderContract: 'packages/core/src/types/upstream/manifestBuilderInterface.ts',
  manifestBuilderRuntime: 'packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts',
  cliManifestComposition: 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts',
  cliScan: 'packages/cli/src/commands/scan.ts',
  cliSync: 'packages/cli/src/commands/sync.ts',
};
const primitiveInventory = Object.fromEntries(Object.entries(runtimeFiles).map(([key, relative]) => {
  const source = read(relative);
  return [key, {
    path: relative,
    exportedFunctionDeclarations: (source.match(/\bexport\s+(?:async\s+)?function\s+/g) || []).length,
    ifStatements: (source.match(/\bif\s*\(/g) || []).length,
    switchStatements: (source.match(/\bswitch\s*\(/g) || []).length,
    ternaryOperators: (source.match(/\?[^?.]/g) || []).length,
    nullishCoalescing: (source.match(/\?\?/g) || []).length,
    strictEqualityOperators: (source.match(/===|!==/g) || []).length,
    reduceCalls: (source.match(/\.reduce\s*\(/g) || []).length,
    mapCalls: (source.match(/\.map\s*\(/g) || []).length,
    visitorMentions: (source.match(/\bvisitor\b/gi) || []).length,
    voidMentions: (source.match(/\bvoid\b/g) || []).length,
  }];
}));
const failed = Object.entries(checks).filter(([, passed]) => !passed);
const result = {
  phase: 3063,
  title: 'Fully Explicit Typed Runtime Scanner Operations — upstream → CLI → manifest primitive frontier audit',
  checks,
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  status: failed.length ? 'FAIL' : 'PASS',
  runtimeTrace: [
    'ControllerDataflowAnalysisOutcome (completed | blocked)',
    'LaravelControllerScannerInterface.scan(input)',
    'LaravelControllerScanJudgment.continueToSourceAstProjection(handlers)',
    'LaravelSourceAstPipelineInterface.execute()',
    'LaravelSourceAstProjectionJudgment (complete | blocked)',
    'ManifestBuilderInterface.build()',
    'ManifestBuilderJudgment (complete | blocked)',
    'ControllerInvocationManifest.continueForDriftAudit(handlers)',
    'CLI scan/sync complete-only projection and output writes',
  ],
  primitiveInventory,
  interpretation: {
    globalPrimitiveElimination: 'NOT_CLAIMED',
    parserAndCliBoundaryDispatch: 'REMAINS_AND_REQUIRES_DOMAIN_BY_DOMAIN_MIGRATION',
    outputBarrier: 'STRUCTURALLY_VERIFIED; NOT_AN_EXECUTED_END_TO_END_FIXTURE',
    strictTypeScript: 'BLOCKED_BY_EXISTING_REPOSITORY_DIAGNOSTICS',
  },
  implementedMigration: 'LaravelControllerScanJudgment now owns continueToSourceAstProjection; producer constructors attach it, and LaravelSourceAstPipeline supplies complete/blocked behavior without checking controllerScan.kind itself.',
};
for (const [name, passed] of Object.entries(checks)) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${result.passed}/${result.total} checks passed`);
console.log('Primitive inventory is observational, not a blanket pass for eliminating those constructs.');
fs.writeFileSync(path.join(root, 'PHASE3063_RUNTIME_INTERFACE_PRIMITIVE_FRONTIER_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
if (failed.length) process.exit(1);
