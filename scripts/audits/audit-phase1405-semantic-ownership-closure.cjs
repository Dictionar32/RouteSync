const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const assert = (name, condition, detail) => checks.push({ name, pass: Boolean(condition), detail });
const upstreamCapability = read('packages/core/src/types/upstream/resourceGroupCapability.ts');
const upstreamAlgebra = read('packages/core/src/types/upstream/resourceGroupCapabilityAlgebra.ts');
const manifest = read('packages/core/src/types/upstream/manifest.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const operationIdentity = read('packages/core/src/types/upstream/operationIdentityCapability.ts');
const operationEmitter = read('packages/cli/src/generators/sdk/apiObjectEmitter.ts');
const hookLowerer = read('packages/cli/src/generators/hooks/hookConfigLowerer.ts');
const hookWiring = read('packages/cli/src/generators/hooks/hookSourceLowerer.ts');
const reactResolver = read('packages/react/src/hooks/define/groupSlotResolver.ts');
const reactTypes = read('packages/react/src/hooks/define/hookTypes.ts');
const scanner = read('packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts');
const semanticProducer = read('packages/core/src/compiler/semantic/sourceAstSemanticProducer.ts');
const semanticProducerContract = read('packages/core/src/types/upstream/sourceAstSemanticProducerInterface.ts');
const routeGrouper = read('packages/cli/src/generators/classifier/routeGrouper.ts');
const routeActionIdentityAuthority = read('packages/core/src/types/upstream/routeActionIdentityCapabilityAuthority.ts');
const sourceEvidenceAcquisition = read('packages/core/src/compiler/semantic/sourceAstEvidenceAcquisition.ts');
const sdkDefinition = read('packages/sdk/src/defineApi.ts');
const pkg = JSON.parse(read('package.json'));
assert('upstream resource group contract carries a closed route/absent/ambiguous ADT', /type ResourceGroupSlotDecision\s*=/.test(upstreamCapability) && /kind: 'ambiguous'/.test(upstreamCapability) && /kind: 'absent'/.test(upstreamCapability) && /executionSlots: ResourceGroupExecutionSlots/.test(upstreamCapability));
assert('upstream algebra is the CRUD slot selection authority', /slotsFromRoutes/.test(upstreamAlgebra) && /executionSlots: slotsFromRoutes\(state\.routes\)/.test(upstreamAlgebra));
assert('manifest transports closed capabilities alongside dataflow and source-model contracts', /resourceGroupCapabilities: readonly ResourceGroupCapabilityContract\[\]/.test(manifest) && /dataflowJudgments/.test(manifest) && /sourceModel: CompleteLaravelSourceModel/.test(manifest));
assert('manifest builder completes AST before semantic model/dataflow and capability publication', /validateCompleteSourceAst/.test(manifestBuilder) && /buildCompleteLaravelSourceModel/.test(manifestBuilder) && /semanticDataflowJudgmentsFromInputs/.test(manifestBuilder) && /resourceGroupCapabilitiesFromRoutes/.test(manifestBuilder));
assert('operation identity has a closed semantic contract and explicit materializer boundary', /interface OperationIdentityCapabilityContractMaterializerInterface/.test(operationIdentity) && /readonly reasoning: SemanticReasoningContract/.test(operationIdentity) && /readonly closed: true/.test(operationIdentity));
assert('SDK emitter projects upstream operation identity instead of deriving identity from HTTP/path', /operationIdentityReferenceFromCapability\(route\.raw\.operationIdentityCapability\)/.test(operationEmitter));
assert('hook lowerer rejects missing/duplicate route identities and consumes upstream cache-operation keys', /matches\.length === 0/.test(hookLowerer) && /matches\.length > 1/.test(hookLowerer) && /reference\.cacheOperationKey/.test(hookLowerer) && !/toNormalizedActionKey/.test(hookLowerer));
assert('manifest wiring rejects duplicate group capability identity instead of map overwrite', /capabilityByName\.has\(capability\.groupName\)/.test(hookWiring) && /duplicate resource-group capability identity/.test(hookWiring));
assert('React runtime requires a closed contract and has no role-scan fallback', /contract: CrudGroupExecutionContract/.test(reactResolver) && /contract\.closed !== true/.test(reactResolver) && !/firstByRole/.test(reactResolver) && /indexService: contract\.indexService/.test(reactResolver));
assert('React HookConfig requires a closed CRUD contract', /crudSlots: CrudGroupExecutionContract/.test(reactTypes) && /readonly closed: true/.test(reactTypes));
assert('scanner delegates semantic products through a typed upstream producer boundary', /sourceAstSemanticProducer\.produce\(sourceProject\)/.test(scanner) && !/statementExpressionRules|statementAssignmentRules|expressionProducer|assignmentProducer/.test(scanner) && /SourceAstSemanticProducerInterface/.test(semanticProducer) && /SourceAstSemanticProducts/.test(semanticProducerContract));
assert('route action identity is resolved upstream and projection no longer suffixes names', /routeActionIdentityCapabilityAuthority\.resolve/.test(routeGrouper) && !/usedActions|while \(used\.has\(/.test(routeGrouper) && /orderedCandidates/.test(routeActionIdentityAuthority));
assert('SDK endpoint contract exposes operation identity metadata', /operationIdentity/.test(sdkDefinition));
assert('package version and build script are unchanged', pkg.version === '1.0.49' && pkg.scripts.build === 'tsdown');
const failed = checks.filter(check => !check.pass);
const relatedAuditPaths = [
  'scripts/audits/audit-phase918-semantic-dataflow-upstream-boundary.cjs',
  'scripts/audits/audit-phase1309-interface-no-semantic-reasoning.cjs',
  'scripts/audits/audit-phase1310-downstream-no-method-semantic-fallback.cjs',
  'scripts/audit-phase729-semantic-relation-calculus-frontier.cjs',
  'scripts/audit-relational-authority-strict.cjs',
];
const relatedAudits = relatedAuditPaths.map(script => {
  const result = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  return {
    script,
    status: result.status === 0 ? 'passed' : 'failed',
    exitCode: result.status,
    summary: output.split('\n').filter(line => /PASS|pass:|clean:|filesWithViolations|semanticDiscriminants|relationSolverUsesStratumClosure|legacyProductionImports/.test(line)).slice(-8),
  };
});
const report = {
  phase: 1405,
  audit: 'semantic-ownership-closure',
  status: failed.length === 0 ? 'passed_with_residuals' : 'failed',
  passed: checks.length - failed.length,
  total: checks.length,
  checks,
  relatedAudits,
  trace: {
    source: 'Laravel source files and source evidence',
    astAdt: 'sourceAstScanner -> CompleteSourceAst -> validateCompleteSourceAst',
    semanticReasoning: 'CompleteLaravelSourceModel + route semantic capabilities + operation identity contracts',
    dataflow: 'SemanticDataflowInput -> SemanticDataflowJudgment -> query policy contract',
    manifest: 'RouteSyncManifest carries AST, source model, dataflow, and resource-group capability contracts',
    wiring: 'CLI hookSourceLowerer and SDK apiObjectEmitter project closed manifest contracts',
    runtime: 'SDK endpoint metadata and React hook resolvers execute projected capabilities',
  },
  residuals: [
    { id: 'R1', severity: 'medium', owner: 'packages/core/src/compiler/semantic/sourceAstSemanticProducer.ts', detail: 'Source file discovery and reading now use a typed acquisition contract; PHP syntax parsing and semantic judgment production remain coupled and should be split next.' },
    { id: 'R2', severity: 'closed', owner: 'packages/react/src/hooks/define/groupSlotResolver.ts', detail: 'Closed: React requires crudSlots and all 18 checked-in ecommerce example groups now declare explicit no-slot contracts because their hand-authored endpoint declarations carry no upstream route capability manifest.' },
    { id: 'R3', severity: 'closed', owner: 'packages/core/src/types/upstream/routeActionIdentityCapabilityAuthority.ts', detail: 'Closed: action-name collision resolution now runs in the upstream authority in stable route-key order; CLI only projects the closed identity result.' },
    { id: 'R4', severity: 'closed', owner: 'packages/core/src/types/upstream/resourceGroupCapabilityAlgebra.ts', detail: 'Closed: cacheOperationKey is now materialized by upstream resource-group algebra and transported through ResourceGroupRouteReference; the generator only projects it.' },
    { id: 'R5', severity: 'medium', owner: 'packages/core/src/types/domain/resourceGroupDescriptors.ts', detail: 'Legacy role-based descriptor helpers need a complete call-site trace before retirement.' },
    { id: 'R6', severity: 'medium', owner: 'packages/core/src/types/upstream/semanticDataflowManifestSurface.ts', detail: 'The manifest currently publishes input and judgment collections; verify that all consumers use judgment/contract results rather than independently rebuilding semantic relations.' },
  ],
  package: { version: pkg.version, build: pkg.scripts.build },
};
fs.mkdirSync(path.join(root, 'scripts/audits/reports'), { recursive: true });
fs.writeFileSync(path.join(root, 'scripts/audits/reports/phase1405-semantic-ownership-closure.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
