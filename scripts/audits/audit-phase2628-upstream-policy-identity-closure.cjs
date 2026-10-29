const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });
const source = read('packages/core/src/types/upstream/highLevelSourceModel.ts');
const resolver = read('packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts');
const binding = read('packages/core/src/types/upstream/controllerActionBindingAlgebra.ts');
const relations = read('packages/core/src/types/upstream/controllerActionPolicyRelations.ts');
const routeRelations = read('packages/core/src/types/upstream/routeActionPolicyRelations.ts');
const manifest = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const manifestContract = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const cli = [
  'packages/cli/src/commands/scan.ts',
  'packages/cli/src/commands/sync.ts',
  'packages/cli/src/commands/audit/driftAuditor.ts',
].map(read);
check('policy resolver has a named upstream semantic authority typed by its interface', /export const effectiveControllerActionPolicySemanticAuthority:\s*import\('\.\/effectiveControllerActionPolicy'\)\.EffectiveControllerActionPolicySemanticAuthorityInterface\s*=\s*Object\.freeze/.test(resolver));
check('policy binding authority returns closed ambiguity and unbound outcomes', /kind: 'supplied_policy_ambiguous'/.test(binding) && /kind: 'unbound'/.test(binding));
check('source-model policy inventory is an explicit upstream interface operation wired to the canonical semantic authority', /export const effectiveControllerActionPolicyInventory:\s*EffectiveControllerActionPolicyInventoryInterface\s*=\s*Object\.freeze/.test(source) && /effectiveControllerActionPolicySemanticAuthority\.judge\(/.test(source) && /effectiveControllerActionPolicyInventory\.inventory\(/.test(source));
check('source-model reference-index builder is the typed exported operation value', /export const sourceModelReferenceIndexBuilder:\s*SourceModelReferenceIndexBuilderInterface\s*=\s*Object\.freeze/.test(source));
check('controller policy relations preserve blocked judgments as explicit relations', /controller_action_policy_blocked/.test(relations));
check('route policy projection preserves blocked judgments as explicit relations', /route_action_policy_blocked/.test(routeRelations));
check('source model uses a closed complete-or-blocked ADT', /export type CompleteSourceModelBuildResult\s*=\s*\n\s*\| CompleteSourceModelBuildCompleteResult\s*\n\s*\| CompleteSourceModelBuildBlockedResult/.test(source));
check('manifest builder returns source-model blockers before dataflow projection', manifest.indexOf("kind === 'source_model_build_blocked'") >= 0 && manifest.indexOf("kind === 'source_model_build_blocked'") < manifest.indexOf('inputsFromSourceModel'));
check('manifest contract has a distinct source-model blocked judgment', /stage: 'source_model'[\s\S]{0,300}blocker: ManifestBuilderSourceModelBlocker/.test(manifestContract) && /kind: 'manifest_builder_source_model_blocked'[\s\S]{0,200}sourceModel: CompleteSourceModelBuildBlockedResult/.test(manifestContract));
check('all three CLI entry points stop on upstream manifest blockers', cli.every(file => /kind === 'manifest_builder_blocked'/.test(file) && /process\.exit\(1\)/.test(file)));
check('source-model and manifest path avoids semantic foundation imports', !/semantic\/foundation/.test(source + manifest + manifestContract));
const failed = checks.filter(result => !result.passed);
for (const result of checks) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
console.log(`Phase 2628 upstream policy identity closure: ${checks.length - failed.length}/${checks.length} assertions passed.`);
if (failed.length) process.exitCode = 1;
