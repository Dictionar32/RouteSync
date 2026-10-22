const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });
const source = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const authority = read('packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts');
const contract = read('packages/core/src/types/upstream/effectiveControllerActionPolicy.ts');
const manifest = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const manifestContract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const cli = [
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/commands/sync.ts',
  'packages/cli/src/commands/audit/driftAuditor.ts',
].map(read);
check('policy inventory input is a named closed data contract', /interface EffectiveControllerActionPolicyInventoryInput\s*\{[\s\S]*?kind: 'effective_controller_action_policy_inventory_input'[\s\S]*?catalog: SourceModelCatalog/.test(source));
check('policy inventory operation has a closed versioned interface', /interface EffectiveControllerActionPolicyInventoryInterface\s*\{[\s\S]*?closed: true[\s\S]*?contractVersion: 1[\s\S]*?inventory:/.test(source));
check('canonical inventory value follows export const name: interface pattern', /export const effectiveControllerActionPolicyInventory:\s*EffectiveControllerActionPolicyInventoryInterface\s*=\s*Object\.freeze/.test(source));
check('inventory delegates semantic judgment to the existing canonical authority', /effectiveControllerActionPolicySemanticAuthority\.judge\(/.test(source) && /readonly judge: \(input: EffectiveControllerActionPolicyUpstreamInput\) => EffectiveControllerActionPolicy/.test(contract));
check('source-model construction invokes the inventory interface and all policy judgments go through the canonical authority', /effectiveControllerActionPolicyInventory\.inventory\(Object\.freeze\(/.test(source) && !/resolveEffectiveControllerActionPolicyUpstream\(/.test(source) && /effectiveControllerActionPolicySemanticAuthority\.judge\(/.test(source));
check('policy inventory preserves controller-action identity and source provenance', /controller: controller\.identity\.name,[\s\S]*?action: controller\.identity\.action,[\s\S]*?source: Object\.freeze\(\[controller\.action\.source\]\)/.test(source));
check('policy inventory builds its catalog from source evidence and empty catalog is documented as route-local composition only', /entries: effectiveControllerActionPolicyCatalogFromSourceModel\(catalog\)/.test(source) && source.includes('The supplied policy already contains the closed inherited products') && /policyCatalog: \{ kind: 'complete', entries: \[\] \}/.test(source));
check('closed complete-or-blocked source-model judgment remains authoritative', /export type CompleteSourceModelBuildResult\s*=\s*\n\s*\| CompleteSourceModelBuildCompleteResult\s*\n\s*\| CompleteSourceModelBuildBlockedResult/.test(source));
const blockerGate = manifest.indexOf("completeLaravelSourceModelBuildResult.kind === 'source_model_build_blocked'");
const dataflow = manifest.indexOf('this.dataflowManifestSurface.inputsFromSourceModel');
check('manifest source-model blocker gate precedes dataflow projection', blockerGate >= 0 && dataflow > blockerGate);
check('manifest operation accepts the interface as a dependency', /sourceModelBuilder: CompleteLaravelSourceModelBuilderInterface/.test(manifestContract) && /sourceModelBuilder: completeLaravelSourceModelBuilder satisfies CompleteLaravelSourceModelBuilderInterface/.test(manifest));
check('scan, sync, and drift audit retain a blocked manifest judgment and fail', cli.every(file => /kind === 'manifest_builder_blocked'/.test(file) && /process\.exit\(1\)/.test(file)));
check('upstream source-model and manifest path stays clear of semantic foundation', !/semantic\/foundation/.test(source + manifest + manifestContract));
const failures = checks.filter(item => !item.passed);
for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}`);
console.log(`Phase 2629 upstream policy inventory interface wiring: ${checks.length - failures.length}/${checks.length} assertions passed.`);
if (failures.length) process.exitCode = 1;
