const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const loader = read('packages/cli/src/standaloneCompositionLoader.ts');
const test = read('packages/cli/src/__tests__/standaloneCompositionLoader.phase2661.test.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['structural contract comparison tracks object pairs to avoid cyclic-graph recursion', /compared: WeakMap<object, WeakSet<object>>/.test(loader) && /seen\.has\(right\)/.test(loader)],
  ['host-controlled composition validation exceptions are converted to invalid_composition ADT', /let validComposition = false;[\s\S]*try \{[\s\S]*isRequestTypeDerivationSemanticPipelineComposition\(composition\)[\s\S]*catch \{[\s\S]*validComposition = false/.test(loader)],
  ['invalid composition still returns a closed discriminated result', /kind: 'composition_module_invalid',[\s\S]*reason: 'invalid_composition'/.test(loader)],
  ['import/evaluation failures remain represented by a separate ADT branch', /kind: 'composition_module_import_failed'/.test(loader)],
  ['canonical public export remains routesync/upstream', /loadRouteSyncStandaloneComposition\('routesync\/upstream'\)/.test(test)],
  ['scan and sync preserve manifest preflight before projection', /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(read('packages/cli/src/commands/scan.ts')) && /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(read('packages/cli/src/commands/sync.ts'))],
  ['Phase 2685 audit is registered', pkg.scripts?.['audit:phase2685-runtime-validation-fail-closed'] === 'node scripts/audits/audit-phase2685-runtime-validation-fail-closed.cjs'],
];
let failed = 0;
for (const [name, pass] of checks) { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`); if (!pass) failed++; }
console.log(`Phase 2685 runtime validation fail-closed: ${checks.length - failed}/${checks.length}`);
if (failed) process.exitCode = 1;
