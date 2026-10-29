const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const controllerContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const routeComposition = read('packages/core/src/compiler/scanner/upstream/routeDeclarationComposition.ts');
const routeContract = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const sourcePipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const collections = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/collections.ts'));
const relationsDir = path.join(root, 'packages/core/src/semantic/relations');
const catalogMethod = routeComposition.match(/catalogFromControllerScan\(controllerScan: LaravelControllerScanJudgment\): EffectiveControllerActionPolicyCatalogJudgment \{([\s\S]*?)\n    \},/);
const firstOutput = source => Math.min(...['writeFileSync(', 'writeJson(', 'manifestGeneratorOperations.save('].map(token => {
  const index = source.indexOf(token);
  return index < 0 ? Number.POSITIVE_INFINITY : index;
}));
const scanGate = cliScan.indexOf('const completeManifest = scannedManifest.continueForDriftAudit');
const syncGate = cliSync.indexOf('const completeManifest = scannedManifest.continueForDriftAudit');
const checks = {
  scannerJudgmentDeclaresNamedRoutePolicyContinuation: /readonly continueToRoutePolicyCatalog: \(handlers: LaravelControllerScanRoutePolicyCatalogHandlers\) => EffectiveControllerActionPolicyCatalogJudgment/.test(controllerContract),
  continuationHandlersKeepCompleteAndBlockedArmsTyped: /interface LaravelControllerScanRoutePolicyCatalogHandlers[\s\S]*?onComplete: \(judgment: LaravelControllerScanCompleteJudgment\) => EffectiveControllerActionPolicyCatalogJudgment[\s\S]*?onBlocked: \(judgment: LaravelControllerScanBlockedJudgment\) => EffectiveControllerActionPolicyCatalogJudgment/.test(controllerContract),
  completeConstructorAttachesDomainContinuation: /complete: \(judgment: LaravelControllerScanCompleteJudgmentData\)[\s\S]*?continueToRoutePolicyCatalog: \(handlers: LaravelControllerScanRoutePolicyCatalogHandlers\)[\s\S]*?handlers\.onComplete\(result\)/.test(controllerContract),
  blockedConstructorAttachesDomainContinuation: /blocked: \(judgment: LaravelControllerScanBlockedJudgmentData\)[\s\S]*?continueToRoutePolicyCatalog: \(handlers: LaravelControllerScanRoutePolicyCatalogHandlers\)[\s\S]*?handlers\.onBlocked\(result\)/.test(controllerContract),
  routeCatalogConsumerUsesJudgmentOperation: Boolean(catalogMethod && /controllerScan\.continueToRoutePolicyCatalog\(/.test(catalogMethod[1])),
  routeCatalogConsumerNoLongerReclassifiesControllerScanKind: Boolean(catalogMethod && !/controllerScan\.kind\s*!==?/.test(catalogMethod[1]) && !/if\s*\(/.test(catalogMethod[1])),
  completeCatalogRetainsControllerPolicyAndActionPolicyFacts: Boolean(catalogMethod && /controller\.policyInventory/.test(catalogMethod[1]) && /sequenceToArray\(action\.policy\)/.test(catalogMethod[1]) && /controller: controller\.identity/.test(catalogMethod[1])),
  blockedCatalogRemainsExplicitAndClosed: Boolean(catalogMethod && /kind: 'blocked'/.test(catalogMethod[1]) && /controller_policy_inventory_unavailable/.test(catalogMethod[1])),
  sourceAstStillUsesScannerOwnedContinuation: /controllerScan\.continueToSourceAstProjection\(/.test(sourcePipeline),
  manifestBuilderStillPreservesBlockedProjection: /kind: 'manifest_builder_blocked'[\s\S]*?projection: blockedProjection/.test(manifestBuilder),
  cliScanBlockedGatePrecedesWrites: scanGate >= 0 && scanGate < firstOutput(cliScan) && /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(cliScan),
  cliSyncBlockedGatePrecedesWrites: syncGate >= 0 && syncGate < firstOutput(cliSync) && /manifestBlocked: judgment =>[\s\S]*?process\.exit\(1\)/.test(cliSync),
  noDeletedRelationFoundationRestoration: !['relationMembership.ts', 'relationalSequence.ts', 'semanticRelations.ts'].some(name => fs.existsSync(path.join(relationsDir, name))),
  protectedCollectionsInvariantStillOneNewlineByte: collections.length === 1 && collections[0] === 10,
};
const failed = Object.entries(checks).filter(([, pass]) => !pass);
const result = {
  phase: 3064,
  title: 'Fully Explicit Typed Runtime Scanner Operations — controller scan to route policy catalog continuation',
  status: failed.length ? 'FAIL' : 'PASS',
  passed: Object.keys(checks).length - failed.length,
  total: Object.keys(checks).length,
  checks,
  runtimeTrace: [
    'PHP controller source → ControllerDataflowAnalysisOutcome',
    'LaravelControllerScannerInterface.scan(input) → LaravelControllerScanJudgment',
    'LaravelControllerScanJudgment.continueToSourceAstProjection(handlers) → source-AST projection',
    'LaravelControllerScanJudgment.continueToRoutePolicyCatalog(handlers) → EffectiveControllerActionPolicyCatalogJudgment',
    'LaravelRouteScannerInterface.prepare(input) → route declaration composition',
    'ManifestBuilderInterface.build() → complete | blocked manifest judgment',
    'CLI scan/sync terminal blocked handler → output writes only after complete manifest projection',
  ],
  verification: {
    structuralAudit: failed.length ? 'FAIL' : 'PASS',
    endToEndPhpCliManifestFixture: 'NOT_RUN',
    strictTypeScript: 'NOT_RUN_IN_THIS_PHASE; repository has known pre-existing type errors',
    globalPrimitiveElimination: 'NOT_CLAIMED',
  },
  remainingRisks: [
    'The blocked route-policy catalog currently preserves the existing empty unavailable-controller list; enriching it with exact blocker controller identities is a separate provenance-preserving migration.',
    'No executable PHP → CLI → manifest fixture was run; structural source checks do not prove runtime output behavior.',
    'Other consumers outside catalogFromControllerScan may still inspect controllerScan.kind and require domain-specific continuation migrations.',
  ],
};
for (const [name, pass] of Object.entries(checks)) console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${result.passed}/${result.total} checks passed`);
console.log(JSON.stringify(result, null, 2));
fs.writeFileSync(path.join(root, 'PHASE3064_CONTROLLER_SCAN_ROUTE_POLICY_CONTINUATION_AUDIT.json'), `${JSON.stringify(result, null, 2)}\n`);
if (failed.length) process.exit(1);
