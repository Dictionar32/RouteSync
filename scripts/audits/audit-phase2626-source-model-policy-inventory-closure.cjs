const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const sourceModel = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const policy = read('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts');
const binding = read('packages/core/src/types/upstream/controllerActionBinding.ts');
const manifestContract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const cliDrift = read('packages/cli/src/commands/audit/driftAuditor.ts');
const packageJson = JSON.parse(read('packages/cli/package.json'));

const checks = [
  () => assert.match(sourceModel, /interface SourceModelReferenceIndexBuilderInterface/),
  () => assert.match(sourceModel, /export const sourceModelReferenceIndexBuilder:\s*SourceModelReferenceIndexBuilderInterface/),
  () => assert.match(sourceModel, /sourceModelReferenceIndexBuilder\.build\(catalog, effectivePolicies\)/),
  () => assert.match(sourceModel, /export const sourceModelReferenceIndexFromCatalog:\s*SourceModelReferenceIndexBuilderInterface\['build'\]/),
  () => assert.doesNotMatch(sourceModel, /effectivePolicies:\s*readonly EffectiveControllerActionPolicy\[\]\s*=\s*\[\]/),
  () => assert.match(sourceModel, /catalogControllers:\s*\[\]/),
  () => assert.doesNotMatch(sourceModel, /return routeActionPolicyRelations\(/),
  () => assert.doesNotMatch(sourceModel, /controllerActionPolicyRelationsFromEvidence\(/),
  () => assert.match(sourceModel, /kind: 'controller_action_policy_binding_unbound'/),
  () => assert.match(sourceModel, /case 'unbound':[\s\S]{0,220}blockedControllerActionPolicyForUnbound/),
  () => assert.match(policy, /kind: 'controller_action_policy_binding_unbound'/),
  () => assert.match(binding, /readonly kind: 'unbound'/),
  () => assert.match(sourceModel, /kind: 'source_model_build_blocked'/),
  () => assert.match(sourceModel, /blockers\.length > 0/),
  () => assert.match(manifestContract, /stage: 'source_ast'/),
  () => assert.match(manifestContract, /stage: 'source_model'/),
  () => assert.match(manifestBuilder, /completeLaravelSourceModelBuildResult\.kind === 'source_model_build_blocked'/),
  () => assert.ok(manifestBuilder.indexOf("completeLaravelSourceModelBuildResult.kind === 'source_model_build_blocked'") < manifestBuilder.indexOf('inputsFromSourceModel(completeLaravelSourceModelBuildResult.value)')),
  () => assert.match(cliScan, /kind === 'manifest_builder_blocked'[\s\S]{0,180}JSON\.stringify\(scannedManifest\)/),
  () => assert.match(cliSync, /kind === 'manifest_builder_blocked'[\s\S]{0,180}JSON\.stringify\(scannedManifest\)/),
  () => assert.match(cliDrift, /kind === 'manifest_builder_blocked'[\s\S]{0,180}JSON\.stringify\(freshManifest\)/),
  () => assert.match(manifestBuilder, /completeLaravelSourceModelBuilder/),
  () => assert.equal(packageJson.scripts['audit:phase2626-source-model-policy-inventory-closure'], 'node ../../scripts/audits/audit-phase2626-source-model-policy-inventory-closure.cjs'),
];

for (const check of checks) check();
process.stdout.write(`Phase 2626 source-model policy inventory closure: ${checks.length}/${checks.length} assertions passed.\n`);
