'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail });

const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const builderInterface = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const flow = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const cliComposition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const runtimeTest = read('packages/core/src/compiler/scanner/__test__/ecommerceShopGraphProvenancePhase992.spec.ts');
const pkg = JSON.parse(read('package.json'));

check('named function declaration remains on the real manifest preparation path', /export function prepareManifestBuilderOperation\(input: ManifestBuilderInput\): ManifestBuilderInterface\s*\{/.test(builder), 'typed input and output on core runtime builder');
check('interface-typed exported constant remains the composition contract', /export const manifestBuilderOperationPreparation:\s*ManifestBuilderOperationPreparationInterface\s*=/.test(builder) && /prepare:\s*\(input: ManifestBuilderInput\) => ManifestBuilderInterface/.test(builderInterface), 'interface boundary delegates to the runtime implementation');
check('typed exported arrow function expression is a real manifest-flow projector', /export const projectRouteSyncManifestFlow = \(manifest: RouteSyncManifest\): RouteSyncManifestFlow => \{\s*return Object\.freeze\(/.test(flow), 'uses requested export const name = (parameter: Parameter): Output => { return ... } form');
check('interface authority delegates to the same arrow-function implementation', /routeSyncManifestFlowProjection:\s*RouteSyncManifestFlowProjectionInterface\s*=\s*Object\.freeze\(\{\s*project:\s*projectRouteSyncManifestFlow/.test(flow), 'runtime path does not duplicate projection logic');
check('named public function declaration calls the interface-backed projection', /export function routeSyncManifestFlowFromManifest\(manifest: RouteSyncManifest\): RouteSyncManifestFlow\s*\{\s*return routeSyncManifestFlowProjection\.project\(manifest\);/.test(flow), 'declaration-style export and expression-style export share one runtime path');
check('CLI manifest composition remains typed and delegates into the same composition authority', /export function buildManifestWithInvocationPipeline\([\s\S]*?\): Promise<ControllerInvocationManifest>\s*\{\s*return controllerInvocationManifestCompositionAuthority\.compose\(/.test(cliComposition), 'CLI entrypoint reaches the manifest composition authority');
check('runtime regression compares arrow projector output to the interface-backed entrypoint', /projectRouteSyncManifestFlow\(manifest\)\)\.toEqual\(manifestFlow\)/.test(runtimeTest), 'runtime test covers behavioral equivalence');
check('detached manifest build regression remains in place', /const build = operation\.build;[\s\S]*?await build\(\)/.test(runtimeTest), 'builder executor remains receiver-independent');
check('audit script is registered', pkg.scripts && pkg.scripts['audit:phase2688-runtime-function-expression-wiring'] === 'node scripts/audits/audit-phase2688-runtime-function-expression-wiring.cjs', 'repeatable audit entrypoint');

for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name} — ${item.detail}`);
const failed = checks.filter(item => !item.ok);
console.log(`\nPhase 2688: ${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) process.exitCode = 1;
