const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const composition = read('packages/cli/src/upstreamCompositionInterface.ts');
const entry = read('packages/core/src/compiler/scanner/wiring/routeManifestProjection.ts');
const projection = read('packages/core/src/compiler/scanner/wiring/routeManifestProjectionAuthority.ts');
const lowering = read('packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts');
const preparation = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationOperationPreparation.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const producer = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts');
const inventory = read('packages/core/src/types/upstream/requestTypeDerivationSourceEvidenceInventory.ts');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const checks = [
  ['scan resolves the semantic pipeline before source acquisition', /requestTypeDerivationSemanticPipelineResolution\.resolve[\s\S]*?createLaravelSourceProjectIdentity/.test(scan)],
  ['sync resolves the semantic pipeline before source acquisition', /requestTypeDerivationSemanticPipelineResolution\.resolve[\s\S]*?createLaravelSourceProjectIdentity/.test(sync)],
  ['scan fails closed when the semantic pipeline is absent', /request_type_semantic_pipeline_unavailable[\s\S]*?process\.exitCode = 1[\s\S]*?return/.test(scan)],
  ['sync fails closed when the semantic pipeline is absent', /request_type_semantic_pipeline_unavailable[\s\S]*?process\.exitCode = 1[\s\S]*?return/.test(sync)],
  ['scan passes the injected pipeline to manifest projection', /projectRouteSyncManifestForRouteManifest\([\s\S]*?requestTypeDerivationPipeline/.test(scan)],
  ['sync passes the injected pipeline to manifest projection', /projectRouteSyncManifestForRouteManifest\([\s\S]*?requestTypeDerivationPipeline/.test(sync)],
  ['CLI composition requires manifest authority and semantic pipeline', /readonly manifestComposition: ControllerInvocationManifestCompositionAuthorityInterface/.test(composition) && /readonly requestTypeDerivationPipeline: RequestTypeDerivationSemanticPipelineInterface/.test(composition)],
  ['projection entry requires pipeline injection with no optional fallback', /pipeline: RequestTypeDerivationSemanticPipelineInterface/.test(entry) && !/pipeline\?/.test(entry)],
  ['active projection creates authority-backed projection from injected pipeline', /createAuthorityBackedRouteManifestProjection\(pipeline\)/.test(entry)],
  ['authority-backed projection delegates to authority-backed lowering', /createAuthorityBackedRouteManifestTypeLowering\(pipeline\)/.test(projection)],
  ['authority-backed lowering prepares derivation through injected pipeline', /createRequestTypeDerivationOperationPreparation\(pipeline, judgmentGroupsConsumer\)/.test(lowering)],
  ['operation preparation invokes derive and assessment integrity validation', /pipeline\.derive\(input\)/.test(preparation) && /pipeline\.validateAssessment\(assessment\)/.test(preparation)],
  ['non-derived outcomes remain explicit and are not projected', /case 'incomplete'[\s\S]*?case 'conflict'[\s\S]*?case 'input_rejected'[\s\S]*?derivation_not_projectable/.test(lowering)],
  ['active authority-backed projection modules do not import legacy solver', !/requestTypeDerivationSolver|requestTypeDerivationProjectionPipeline/.test(projection + lowering + preparation)],
  ['production composition assembles existing capabilities rather than inventing fallback', /createRequestTypeDerivationSemanticPipelineAssembler/.test(producer) && /\.assemble\(composition\)/.test(producer) && /Legacy RequestType\[\] fallback is disabled/.test(producer)],
  ['semantic reasoning contract returns source-bound inference packet', /readonly infer:[\s\S]*?\) => TInference/.test(contract)],
  ['complete proof coverage is keyed by the full law union', /REQUEST_TYPE_DERIVATION_LAW_IDS = \[[\s\S]*?as const/.test(contract) && /Record<RequestTypeDerivationLawId, 'verified'>/.test(contract)],
  ['upstream inventory exposes typed named identity operations', /export const canonicalRouteIdentity: RequestTypeDerivationSourceEvidenceInventoryInterface\['canonicalRouteIdentity'\]/.test(inventory) && /export const canonicalRouteOccurrenceKey: RequestTypeDerivationSourceEvidenceInventoryInterface\['canonicalRouteOccurrenceKey'\]/.test(inventory)],
  ['legacy solver still exists only as a separate alternate path, not the active authority projection', fs.existsSync(path.join(root, 'packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts')) && !/requestTypeDerivationSolver/.test(entry + projection + lowering + preparation)],
];
let failures = 0;
for (const [label, condition] of checks) {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) failures += 1;
}
for (const [label, source] of [['scan', scan], ['sync', sync], ['projection', entry], ['authority-projection', projection], ['authority-lowering', lowering], ['operation-preparation', preparation], ['production-composition', producer], ['inventory', inventory]]) {
  const result = ts.transpileModule(source, { fileName: `${label}.ts`, compilerOptions: { target: ts.ScriptTarget.ES2024, module: ts.ModuleKind.ESNext }, reportDiagnostics: true });
  const errors = (result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error);
  console.log(`${errors.length === 0 ? 'PASS' : 'FAIL'} TypeScript syntax transpilation: ${label}`);
  failures += errors.length;
}
console.log(`Phase 2572: ${checks.length + 8 - failures}/${checks.length + 8} assertions passed.`);
process.exitCode = failures ? 1 : 0;
