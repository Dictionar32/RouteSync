const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const stat = relative => fs.statSync(path.join(root, relative)).size;
const cliBoundary = read('packages/cli/src/manifestScanOperationInterface.ts');
const compositionContract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const manifestBuilder = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const semanticDataflow = read('packages/core/src/types/upstream/semanticDataflowKnowledge.ts');
const reportPath = path.join(root, 'packages/core/src/types/upstream/PHASE2870_AUDIT.json');
const checks = {
  cliFactoryHasNamedInterfaceFirstExport: /export const routeSyncCliManifestScanOperationFactory:\s*RouteSyncCliManifestScanOperationFactoryInterface\s*=\s*Object\.freeze\(/.test(cliBoundary),
  cliScanDelegatesToCompositionAuthority: /scan:\s*\(input: ControllerInvocationManifestCompositionInput\): Promise<ControllerInvocationManifest>\s*=>\s*authority\.compose\(input\)/.test(cliBoundary),
  compositionFactoryHasNamedInterfaceFirstExport: /export const controllerInvocationManifestCompositionAuthorityFactory:\s*ControllerInvocationManifestCompositionAuthorityFactoryInterface\s*=\s*Object\.freeze\(/.test(composition),
  manifestBuilderEntryHasNamedInterfaceFirstExport: /export const controllerInvocationManifestBuilder:\s*ControllerInvocationManifestBuilderInterface\s*=\s*Object\.freeze\(/.test(composition),
  compositionInjectsExistingDependencies: /readonly sourceProjectIdentityCanonicalization: ControllerSourceProjectIdentityCanonicalizationInterface/.test(compositionContract) && /readonly manifestBuilderPreparation: ManifestBuilderOperationPreparationInterface/.test(compositionContract),
  manifestBuilderOutcomesExposeContinuation: /interface ManifestBuilderCompleteJudgment[\s\S]*?readonly continueWith:/.test(manifestBuilder) && /interface ManifestBuilderSourceAstBlockedJudgment[\s\S]*?readonly continueWith:/.test(manifestBuilder) && /interface ManifestBuilderSourceModelBlockedJudgment[\s\S]*?readonly continueWith:/.test(manifestBuilder),
  astFailureRemainsBlockedEvidence: /readonly projection: Exclude<LaravelSourceAstProjectionJudgment, \{ readonly kind: 'laravel_source_ast_projection_complete' \}>/.test(manifestBuilder),
  cliTerminalOutcomesHaveDomainContinuation: /interface ControllerInvocationManifestTerminalOperationInterface[\s\S]*?continueForDriftAudit/.test(compositionContract),
  phase2869SemanticOperationsRemainInterfaceFirst: ['semanticDependency', 'semanticValueFlow', 'semanticEdge', 'semanticIdentifier', 'semanticOperation'].every(name => new RegExp(`export const ${name}:\\s*[A-Za-z_$][\\w$]*\\s*=\\s*Object\\.freeze\\(`).test(semanticDataflow)),
  collectionsRemainEmpty: stat('packages/core/src/types/upstream/collections.ts') === 0,
  traceDocumentExists: fs.existsSync(path.join(root, 'packages/core/src/types/upstream/PHASE2870_FULLY_TYPED_RUNTIME_SCANNER_OPERATIONS_TRACE.md')),
  compositionControlFlowDebtDisclosed: /still has local `if` decisions/.test(read('packages/core/src/types/upstream/PHASE2870_FULLY_TYPED_RUNTIME_SCANNER_OPERATIONS_TRACE.md')),
};
const result = {
  phase: 2870,
  title: 'Fully Typed Runtime Scanner Operations — CLI Manifest Trace',
  scope: ['CLI scan boundary', 'composition authority', 'source identity/discovery/read', 'invocation pipeline', 'inventory closure', 'manifest builder judgment', 'terminal continuation'],
  checks,
  passedChecks: Object.values(checks).filter(Boolean).length,
  totalChecks: Object.keys(checks).length,
  knownLimitations: [
    'Regex-based structural audit, not TypeScript AST analysis.',
    'Does not claim every upstream export is interface-first.',
    'Does not prove typecheck, build, or end-to-end tests pass.',
    'Composition still has local control-flow decisions that require domain-contract evolution.'
  ],
  collectionsBytes: stat('packages/core/src/types/upstream/collections.ts'),
};
fs.writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (result.passedChecks !== result.totalChecks) process.exitCode = 1;
