const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const drift = read('packages/cli/src/commands/audit/driftAuditor.ts');
const scan = read('packages/cli/src/manifestScanOperationInterface.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const collections = path.join(root, 'packages/core/src/types/upstream/collections.ts');
const checks = [
  ['builder contract has an explicit operation identity and version', /interface ControllerInvocationManifestBuilderInterface\s*\{\s*readonly kind: 'controller_invocation_manifest_builder';\s*readonly contractVersion: 1;/s.test(contract)],
  ['builder accepts the existing named composition input ADT, not positional arguments', /readonly build:\s*\(input: ControllerInvocationManifestCompositionInput\) => Promise<ControllerInvocationManifest>/.test(contract) && !/readonly build:\s*\(\s*sourceProject: SourceProjectIdentity/.test(contract)],
  ['builder runtime export is interface-first and frozen', /export const controllerInvocationManifestBuilder:\s*ControllerInvocationManifestBuilderInterface\s*=\s*Object\.freeze/.test(composition)],
  ['builder forwards the domain input unchanged to the scan operation', /build:\s*\(input: ControllerInvocationManifestCompositionInput\): Promise<ControllerInvocationManifest> =>\s*routeSyncCliManifestScanOperationFactory\.create\(controllerInvocationManifestCompositionAuthority\)\.scan\(input\)/s.test(composition)],
  ['drift audit call site constructs the explicit composition input ADT', /controllerInvocationManifestBuilder\.build\(Object\.freeze\(\{\s*kind: 'controller_invocation_manifest_composition_input',\s*sourceProject:/s.test(drift) && /routeSelection: Object\.freeze\(\{ kind: 'laravel_route_source_selection_default' \}\)/.test(drift)],
  ['CLI scan operation also accepts the same composition input contract', /readonly scan: \(input: ControllerInvocationManifestCompositionInput\) => Promise<ControllerInvocationManifest>/.test(scan)],
  ['existing upstream barrel retains the PHP source frontend contract', upstreamIndex.includes("export * from './phpSourceFrontendInterface'")],
  ['no exported function declarations in traced runtime modules', !/^\s*export\s+function\s/m.test(composition) && !/^\s*export\s+function\s/m.test(scan) && !/^\s*export\s+function\s/m.test(drift)],
  ['upstream collections utility remains empty', fs.statSync(collections).size === 0],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
