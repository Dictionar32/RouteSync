const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const controllerRuntime = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const sourcePipelineInterface = read('packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts');
const sourcePipelineRuntime = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const legacyScanner = read('packages/core/src/compiler/scanner/StaticLaravelScanner.ts');
const report = read('packages/core/src/types/upstream/PHASE1965_INTERFACE_FIRST_LARAVEL_INVOCATION_TRACE.md');
const checks = {
  canonicalJudgmentIsClosedUnion: /export type LaravelControllerInvocationSemanticJudgmentInterface\s*=/.test(judgment),
  allFourIntegratedOutcomesRetained: ['not_connected', 'source_binding_rejected', 'complete', 'blocked'].every(kind => judgment.includes(`php_source_invocation_integration_${kind}`)),
  authorityComposesSourceBindingAndIntegration: /sourceBinding: phpSourceInvocationSemanticSourceBindingAuthority/.test(authority) && /integration: phpSourceInvocationSemanticPipelineIntegrationAuthority/.test(authority),
  controllerParserReceivesCanonicalJudgment: /parseControllerDeclarationFromInvocationJudgment\([^;]*invocationJudgment/s.test(controllerRuntime),
  controllerProducerReceivesSameJudgment: /controllerProducer\.produce\(\{ declaration: declarationEvidence, invocationJudgment \}\)/.test(controllerRuntime),
  sourcePipelineContractConsumesClosedInventory: /execute: \(invocationInventoryReceipt: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt\) => Promise<SourceAsts>/.test(sourcePipelineInterface),
  exactReceiptRetainedInSourceAsts: /controllerInvocationSemanticInventory:\s*invocationInventoryReceipt/.test(sourcePipelineRuntime),
  legacyStaticScannerRemainsEmpty: legacyScanner.trim().length === 0,
  noRelationOrFoundationSubscannerAdded: !exists('packages/core/src/compiler/scanner/operations/relation') && !exists('packages/core/src/compiler/scanner/operations/foundation'),
  rootGapExplicitlyRecorded: /Root problem still present/.test(report) && /directly invokes many concrete subscanner implementations/.test(report),
};
console.log(JSON.stringify({ phase: 1965, auditKind: 'trace-integrity-not-migration-completion', checks, passed: Object.values(checks).filter(Boolean).length, total: Object.keys(checks).length, remainingArchitectureGap: 'LaravelSourceAstPipeline runtime still directly orchestrates concrete operations and controller scanner still constructs controller evidence at runtime; next change must evolve the existing upstream interface from traced producer types.' }, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;
