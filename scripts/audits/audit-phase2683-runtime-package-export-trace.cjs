const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const loader = read('packages/cli/src/standaloneCompositionLoader.ts');
const runtime = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticComposition.ts');
const upstream = read('packages/core/src/upstream.ts');
const test = read('packages/cli/src/__tests__/standaloneCompositionLoader.phase2661.test.ts');
const readme = read('examples/upstream-composition/README.md');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['canonical runtime composition uses export const name: Interface', /export const requestTypeDerivationSemanticComposition:\s*RequestTypeDerivationSemanticPipelineCompositionInterface/.test(runtime)],
  ['public upstream entrypoint re-exports the exact runtime composition', /export \{[^}]*requestTypeDerivationSemanticComposition[^}]*\} from '\.\/compiler\/semantic\/request-type-derivation\/requestTypeDerivationSemanticComposition'/.test(upstream)],
  ['loader distinguishes filesystem paths from bare package specifiers', /resolveCompositionModuleSpecifier/.test(loader) && /isAbsolute\(modulePath\)/.test(loader) && /return isFilesystemPath \? pathToFileURL\(resolve\(process\.cwd\(\), modulePath\)\)\.href : modulePath/.test(loader)],
  ['loader imports the resolved module specifier and resolves the exact named export', /await import\(moduleSpecifier\)/.test(loader) && /member\(loaded, ROUTESYNC_UPSTREAM_COMPOSITION_EXPORT\)/.test(loader)],
  ['runtime regression test loads the real public upstream export without an examples shim', /loads the interface-typed composition through the published package export/.test(test) && /routesync\/upstream/.test(test) && /toEqual\(requestTypeDerivationSemanticComposition\.contract\)/.test(test)],
  ['usage documentation explains package export specifier as runtime path', /resolvable package export specifier/.test(readme) && /does not use an examples-only shim/.test(readme)],
  ['scan and sync retain complete-manifest preflight before projection', /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(scan) && /project\(\s*requestResolutionPreflight/.test(scan) && /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(sync) && /project\(\s*requestResolutionPreflight/.test(sync)],
  ['Phase 2683 runtime trace audit is registered', pkg.scripts?.['audit:phase2683-runtime-package-export-trace'] === 'node scripts/audits/audit-phase2683-runtime-package-export-trace.cjs'],
];
let failed = 0;
for (const [name, pass] of checks) { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`); if (!pass) failed++; }
console.log(`Phase 2683 runtime package-export trace: ${checks.length - failed}/${checks.length}`);
if (failed) process.exitCode = 1;
