const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });

const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const sourceModel = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const cliIndex = read('packages/cli/src/index.ts');
const compositionLoader = read('packages/cli/src/standaloneCompositionLoader.ts');
const semanticProducerDir = 'packages/core/src/compiler/semantic/request-type-derivation';
const semanticFiles = fs.readdirSync(path.join(root, semanticProducerDir)).filter(file => file.endsWith('.ts') && !file.includes('test'));
const hasConcreteReasoningProducer = semanticFiles.some(file => {
  const source = read(`${semanticProducerDir}/${file}`);
  return /RequestTypeDerivationSemanticReasoningInterface/.test(source)
    && /readonly\s+infer\s*:/.test(source)
    && /kind:\s*'request_type_derivation_proof'/.test(source);
});
const before = (source, first, second) => source.indexOf(first) >= 0 && source.indexOf(second) > source.indexOf(first);

check('scan-validates-request-type-pipeline-before-source-project-identity', before(scan, 'if (requestTypeDerivationPipeline === undefined)', 'const sourceProject = createLaravelSourceProjectIdentity(targetDir)'));
check('scan-validates-manifest-authority-before-source-project-identity', before(scan, 'if (manifestComposition === undefined)', 'const sourceProject = createLaravelSourceProjectIdentity(targetDir)'));
check('scan-validates-manifest-authority-before-source-file-selection', before(scan, 'if (manifestComposition === undefined)', 'const routeSourceSelection = laravelRouteSourceSelectionAuthority.explicitFiles'));
check('sync-validates-request-type-pipeline-before-source-project-identity', before(sync, 'if (requestTypeDerivationPipeline === undefined)', 'const sourceProject = createLaravelSourceProjectIdentity(targetDir)'));
check('sync-validates-manifest-authority-before-source-project-identity', before(sync, 'if (manifestComposition === undefined)', 'const sourceProject = createLaravelSourceProjectIdentity(targetDir)'));
check('sync-validates-manifest-authority-before-source-file-selection', before(sync, 'if (manifestComposition === undefined)', 'const routeSourceSelection = laravelRouteSourceSelectionAuthority.explicitFiles'));
check('source-model-policy-inventory-is-interface-owned', /export const effectiveControllerActionPolicyInventory:\s*EffectiveControllerActionPolicyInventoryInterface\s*=\s*Object\.freeze/.test(sourceModel) && /effectiveControllerActionPolicyInventory\.inventory\(/.test(sourceModel));
check('manifest-blocker-gate-precedes-dataflow-projection', before(manifestBuilder, "completeLaravelSourceModelBuildResult.kind === 'source_model_build_blocked'", 'this.dataflowManifestSurface.inputsFromSourceModel'));
check('standalone-cli-remains-fail-closed-without-host-composition', cliIndex.includes('loadRouteSyncStandaloneComposition') && compositionLoader.includes("kind: 'composition_module_missing'") && !/const\s+program\s*=\s*createProgram\(\)/.test(cliIndex));
check('missing-production-request-type-reasoning-is-reported-as-an-explicit-blocker', !hasConcreteReasoningProducer);
check('active-upstream-path-does-not-import-semantic-foundation', !/semantic\/foundation/.test(sourceModel + manifestBuilder));

for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? `: ${item.detail}` : ''}`);
const failed = checks.filter(item => !item.passed);
console.log(`Phase 2630 CLI upstream-authority preflight: ${checks.length - failed.length}/${checks.length} assertions passed.`);
if (failed.length) process.exitCode = 1;
