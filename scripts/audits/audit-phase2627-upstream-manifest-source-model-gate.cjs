const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const checks = [];
const check = (name, condition) => {
  checks.push({ name, passed: Boolean(condition) });
};
const sourceModel = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const manifestContract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const manifestBuilder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const cliFiles = [
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/commands/sync.ts',
  'packages/cli/src/commands/audit/driftAuditor.ts',
].map(read);
const policyIndexStart = sourceModel.indexOf('export const sourceModelReferenceIndexFromCatalog');
const policyIndexEnd = sourceModel.indexOf('export const sourceModelReferenceIndexBuilder', policyIndexStart);
const policyIndex = sourceModel.slice(policyIndexStart, policyIndexEnd);
const blockedGate = manifestBuilder.indexOf("completeLaravelSourceModelBuildResult.kind === 'source_model_build_blocked'");
const dataflowCall = manifestBuilder.indexOf('this.dataflowManifestSurface.inputsFromSourceModel');
check('source-model index builder is explicitly typed to its upstream interface', /export const sourceModelReferenceIndexBuilder:\s*SourceModelReferenceIndexBuilderInterface\s*=\s*Object\.freeze/.test(sourceModel));
check('complete source-model builder is explicitly typed to its upstream interface', /export const completeLaravelSourceModelBuilder:\s*CompleteLaravelSourceModelBuilderInterface\s*=\s*Object\.freeze/.test(sourceModel));
check('policy inventory is a required argument, not defaulted to empty', /build:\s*\(\s*catalog:\s*SourceModelCatalog,\s*effectivePolicies:\s*readonly EffectiveControllerActionPolicy\[\]/.test(sourceModel) && !/effectivePolicies\s*=\s*\[\]/.test(policyIndex));
check('unbound policy binding creates a closed blocker judgment', /case 'unbound':[\s\S]{0,500}blockedControllerActionPolicyForUnbound/.test(policyIndex));
check('raw policy evidence is not used as a fallback when binding is absent', !/case 'unbound':[\s\S]{0,700}return\s+[^;]*policyCatalog/.test(policyIndex));
check('source model result is a closed complete-or-blocked ADT', /export type CompleteSourceModelBuildResult\s*=\s*\n\s*\|\s*CompleteSourceModelBuildCompleteResult\s*\n\s*\|\s*CompleteSourceModelBuildBlockedResult/.test(sourceModel));
check('source-model construction blocks on controller-action and route-action policy relations', /relation\.kind === 'controller_action_policy_blocked' \|\| relation\.kind === 'route_action_policy_blocked'/.test(sourceModel));
check('manifest judgment preserves source-model blockers as a distinct stage', /stage:\s*'source_model'[\s\S]{0,250}sourceModel:\s*CompleteSourceModelBuildBlockedResult/.test(manifestContract));
check('manifest builder checks blocked source model before dataflow projection', blockedGate >= 0 && dataflowCall > blockedGate);
check('manifest builder returns the exact source-model blocker judgment', /stage:\s*'source_model',\s*sourceProject,\s*sourceModel:\s*completeLaravelSourceModelBuildResult/.test(manifestBuilder));
check('scan, sync, and drift audit all stop on and report the full upstream judgment', cliFiles.every(s => /kind === 'manifest_builder_blocked'/.test(s) && /JSON\.stringify\((?:scannedManifest|freshManifest)\)/.test(s)));
check('manifest path does not import semantic foundation', ![
  'packages/core/src/types/upstream/highLevelSourceModel.ts',
  'packages/core/src/types/upstream/manifestBuilderInterface.ts',
  'packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts',
].some(p => /semantic\/foundation/.test(read(p))));
const failures = checks.filter(x => !x.passed);
for (const result of checks) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
console.log(`Phase 2627 upstream-manifest source-model gate audit: ${checks.length - failures.length}/${checks.length} assertions passed.`);
if (failures.length) process.exitCode = 1;
