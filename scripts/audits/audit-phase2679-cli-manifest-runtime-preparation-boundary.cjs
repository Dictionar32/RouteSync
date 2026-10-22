const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const loader = read('packages/cli/src/standaloneCompositionLoader.ts');
const loaderTest = read('packages/cli/src/__tests__/standaloneCompositionLoader.phase2661.test.ts');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const scan = read('packages/cli/src/commands/scan.ts');
const sync = read('packages/cli/src/commands/sync.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['canonical composition declares preparation as mandatory', /readonly preparation: RequestTypeDerivationSemanticInputPreparationInterface/.test(contract)],
  ['runtime loader rejects absent preparation capability', /const preparation = member\(value, 'preparation'\)[\s\S]*member\(preparation, 'prepare'\)[\s\S]*=== 'function'/.test(loader)],
  ['runtime test covers missing and malformed preparation', /rejects a host composition without executable source preparation/.test(loaderTest) && /preparation: undefined/.test(loaderTest)],
  ['loader still validates shared canonical contract identity', /contract !== requestTypeDerivationContract/.test(loader)],
  ['loader still checks canonical authority rule inventory', /REQUEST_TYPE_AUTHORITY_DECISION_RULE_IDS\.every/.test(loader)],
  ['loader still requires executable contract equivalence', /'equivalent'\) as object, 'equivalent'\) === 'function'/.test(loader) || /'equivalent'\) === 'function'/.test(loader)],
  ['scan consumes the injected semantic pipeline and complete-manifest preflight', /composition\.requestTypeDerivationPipeline/.test(scan) && /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(scan)],
  ['sync consumes the injected semantic pipeline and complete-manifest preflight', /composition\.requestTypeDerivationPipeline/.test(sync) && /routeManifestRequestResolutionPreflight\.evaluate\(completeManifest\)/.test(sync)],
  ['audit is registered as a package script', pkg.scripts?.['audit:phase2679-cli-manifest-runtime-preparation-boundary'] === 'node scripts/audits/audit-phase2679-cli-manifest-runtime-preparation-boundary.cjs'],
];
let failed = 0;
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`);
  if (!pass) failed++;
}
console.log(`Phase 2679 CLI manifest runtime preparation audit: ${checks.length - failed}/${checks.length}`);
if (failed) process.exitCode = 1;
