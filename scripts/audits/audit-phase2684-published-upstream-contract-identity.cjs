const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const loader = read('packages/cli/src/standaloneCompositionLoader.ts');
const test = read('packages/cli/src/__tests__/standaloneCompositionLoader.phase2661.test.ts');
const readme = read('examples/upstream-composition/README.md');
const upstream = read('packages/core/src/upstream.ts');
const checks = [
  ['published root package declares routesync/upstream import and require exports', pkg.name === 'routesync' && pkg.exports?.['./upstream']?.import === './dist/upstream.mjs' && pkg.exports?.['./upstream']?.require === './dist/upstream.js'],
  ['public upstream source exports the interface-typed runtime composition', /export const requestTypeDerivationSemanticComposition:\s*RequestTypeDerivationSemanticPipelineCompositionInterface/.test(read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticComposition.ts')) && /requestTypeDerivationSemanticComposition/.test(upstream)],
  ['runtime loader accepts canonical contract value across separately bundled module graphs', /structurallyEqual\(contract, requestTypeDerivationContract\)/.test(loader) && !/contract !== requestTypeDerivationContract/.test(loader)],
  ['capabilities remain bound to the exact contract object owned by their loaded composition', /isCapability\(member\(value, 'reasoning'\), contract, 'infer'\)/.test(loader) && /isCapability\(member\(value, 'decision'\), contract, 'decide'\)/.test(loader) && /isCapability\(authority, contract, 'evaluate'\)/.test(loader) && /isCapability\(integrity, contract, 'validate'\)/.test(loader)],
  ['integration test uses published package specifier rather than workspace-only alias', /loadRouteSyncStandaloneComposition\('routesync\/upstream'\)/.test(test) && !/loadRouteSyncStandaloneComposition\('@routesync\/core\/upstream'\)/.test(test)],
  ['host instructions document the actual published package export', /routesync\/upstream/.test(readme) && !/such as `@routesync\/core\/upstream`/.test(readme)],
  ['CLI loader remains fail-closed for missing/invalid named export', /composition_module_import_failed/.test(loader) && /composition_module_invalid/.test(loader) && /ROUTESYNC_UPSTREAM_COMPOSITION_EXPORT/.test(loader)],
  ['scan and sync preserve complete-manifest preflight before projection', /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(read('packages/cli/src/commands/scan.ts')) && /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(read('packages/cli/src/commands/sync.ts'))],
  ['Phase 2684 audit is registered', pkg.scripts?.['audit:phase2684-published-upstream-contract-identity'] === 'node scripts/audits/audit-phase2684-published-upstream-contract-identity.cjs'],
];
let failed = 0;
for (const [name, pass] of checks) { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`); if (!pass) failed++; }
console.log(`Phase 2684 published upstream contract identity: ${checks.length - failed}/${checks.length}`);
if (failed) process.exitCode = 1;
