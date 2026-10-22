'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail });

const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const builderInterface = read('packages/core/src/types/upstream/manifestBuilderInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const flow = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const phase2686 = read('scripts/audits/audit-phase2686-upstream-cli-manifest-builder-runtime-trace.cjs');
const scan = read('packages/cli/src/commands/scan.ts');
const runtimeTest = read('packages/core/src/compiler/scanner/__test__/ecommerceShopGraphProvenancePhase992.spec.ts');
const pkg = JSON.parse(read('package.json'));

check('manifest builder runtime uses a named exported function with explicit input and return types', /export function prepareManifestBuilderOperation\(input: ManifestBuilderInput\): ManifestBuilderInterface\s*\{/.test(builder), 'function declaration is in packages/core runtime, not only in examples');
check('runtime regression test invokes the builder method detached from its receiver', /const build = operation\.build;[\s\S]*?await build\(\)/.test(runtimeTest) && /expect\(judgment\.kind\)\.toBe\('manifest_builder_complete'\)/.test(runtimeTest), 'test exercises the actual core manifest builder with a detached method');
check('builder operation still conforms to the typed preparation interface', /export const manifestBuilderOperationPreparation:\s*ManifestBuilderOperationPreparationInterface/.test(builder) && /prepare:\s*\(input: ManifestBuilderInput\) => ManifestBuilderInterface/.test(builderInterface), 'interface-typed composition value delegates to the named function');
check('manifest build executor no longer depends on method receiver state', /async build\(\): Promise<ManifestBuilderJudgment>/.test(builder) && !/this\.(?:input|sourceAstPipeline|sourceModelBuilder|dataflowManifestSurface|resourceGroupCapabilityAlgebra)/.test(builder), 'detached invocation of build retains explicit operation inputs and dependencies');
check('builder invokes the exact prepared source-AST pipeline and source-model/dataflow authorities', /await sourceAstPipeline\.execute\(\)/.test(builder) && /sourceModelBuilder\.build\(/.test(builder) && /dataflowManifestSurface\.judgmentsFromInputs\(/.test(builder) && /resourceGroupCapabilitiesAlgebra\.compose\(/.test(builder), 'runtime manifest products are derived from named dependencies');
check('CLI manifest composition entrypoint uses an exported named function with typed parameters', /export function buildManifestWithInvocationPipeline\(\s*sourceProject: SourceProjectIdentity,\s*routeSelection: LaravelRouteSourceSelectionIntent,\s*\): Promise<ControllerInvocationManifest>\s*\{/.test(composition), 'CLI runtime call path is explicit in function signature');
check('manifest flow projection entrypoint uses a named typed function', /export function routeSyncManifestFlowFromManifest\(manifest: RouteSyncManifest\): RouteSyncManifestFlow\s*\{/.test(flow), 'flow conversion is part of core runtime implementation');
check('named-function audit is tied to the existing upstream manifest runtime trace', /manifestBuilderOperationPreparation/.test(builder) && /scan command builds manifest through injected authority/.test(phase2686) && /manifestComposition\.compose\(/.test(scan), 'new audit extends the prior runtime-path audit');
check('audit command is registered in package scripts', pkg.scripts && pkg.scripts['audit:phase2687-runtime-named-function-wiring'] === 'node scripts/audits/audit-phase2687-runtime-named-function-wiring.cjs', 'repeatable local audit entrypoint');

for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name} — ${item.detail}`);
const failed = checks.filter(item => !item.ok);
console.log(`\nPhase 2687: ${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) process.exitCode = 1;
