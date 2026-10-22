'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail });

const iface = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const producer = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const factory = read('packages/cli/src/upstreamCompositionFactory.ts');
const cli = read('packages/cli/src/index.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const loader = read('packages/cli/src/standaloneCompositionLoader.ts');
const example = read('examples/upstream-composition/host-composition.template.ts');
const pkg = JSON.parse(read('package.json'));

check('manifest producer has an explicit composition interface', /export interface ControllerInvocationManifestCompositionAuthorityInterface[\s\S]*?compose:\s*\(input: ControllerInvocationManifestCompositionInput\) => Promise<ControllerInvocationManifest>/.test(iface), 'manifest composition is an executable typed boundary');
check('runtime manifest authority is exported with its interface annotation', /export const controllerInvocationManifestCompositionAuthority:\s*ControllerInvocationManifestCompositionAuthorityInterface\s*=/.test(producer), 'the interface-typed value is the canonical runtime authority');
check('source project identity is canonicalized before discovery', producer.indexOf('sourceProjectIdentityCanonicalization.canonicalize') >= 0 && producer.indexOf('sourceDiscovery.discover') > producer.indexOf('sourceProjectIdentityCanonicalization.canonicalize'), 'identity precedes discovery');
check('source reads and identity binding precede inventory closure', producer.indexOf('sourceDocumentReader.read') >= 0 && producer.indexOf('sourceDocumentIdentityBinding.bind') >= 0 && producer.indexOf('inventoryAuthority.close') > producer.indexOf('sourceDocumentIdentityBinding.bind'), 'inventory closure consumes source-bound judgments');
check('manifest builder receives only the validated inventory receipt', /case 'laravel_controller_invocation_semantic_judgment_inventory_validated':[\s\S]*?invocationInventoryReceipt:\s*inventoryResult\.receipt[\s\S]*?\.build\(\)/.test(producer) && /case 'laravel_controller_invocation_semantic_judgment_inventory_rejected':[\s\S]*?controller_invocation_manifest_inventory_rejected/.test(producer), 'rejected inventory cannot reach manifest builder');
check('CLI composition factory assembles the injected semantic pipeline', /assembleRequestTypeDerivationProductionPipeline\(semanticComposition\)/.test(factory) && /manifestComposition,\s*requestTypeDerivationPipeline:\s*assembly\.pipeline/.test(factory), 'semantic pipeline and manifest authority are composed together');
check('CLI runtime factory injects the canonical manifest authority', /composeRouteSyncCliUpstream\(\s*controllerInvocationManifestCompositionAuthority,\s*semanticComposition,?\s*\)/.test(cli), 'the runtime program receives the typed manifest authority');
check('scan command builds manifest through injected authority', /manifestComposition\.compose\(Object\.freeze\(\{[\s\S]*?kind:\s*'controller_invocation_manifest_composition_input'/.test(scan), 'scan uses runtime composition rather than an examples-only implementation');
check('sync command builds manifest through the same injected authority', /manifestComposition\.compose\(Object\.freeze\(\{[\s\S]*?kind:\s*'controller_invocation_manifest_composition_input'/.test(sync), 'sync uses runtime composition rather than a parallel builder');
check('both commands gate projection on request-resolution preflight and semantic projection ADT', /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(scan) && /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(sync) && /case 'manifest_projection_blocked'/.test(scan) && /case 'manifest_projection_blocked'/.test(sync), 'projection failure is explicit in both commands');
check('published host example declares the exact named interface-typed runtime export', /export const requestTypeDerivationSemanticComposition:\s*RequestTypeDerivationSemanticPipelineCompositionInterface\s*=/.test(example) && /ROUTESYNC_UPSTREAM_COMPOSITION_EXPORT\s*=\s*'requestTypeDerivationSemanticComposition'/.test(loader), 'example export name matches loader contract');
check('published package export exposes upstream entrypoint', Boolean(pkg.exports && pkg.exports['./upstream'] && pkg.exports['./upstream'].import === './dist/upstream.mjs'), 'routesync/upstream maps to built package output');

for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'} ${item.name} — ${item.detail}`);
const failed = checks.filter(item => !item.ok);
console.log(`\nPhase 2686: ${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) process.exitCode = 1;
