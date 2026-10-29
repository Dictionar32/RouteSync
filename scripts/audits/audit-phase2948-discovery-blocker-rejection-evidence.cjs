const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const tests = read('packages/core/src/types/upstream/__tests__/laravel-controller-source-discovery-blocker.phase2915.test.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const evidenceKinds = [
  'controller_source_discovery_root_missing',
  'controller_source_discovery_directory_missing',
  'controller_source_discovery_path_not_directory',
  'controller_source_discovery_directory_unreadable',
  'controller_source_discovery_failure_code_unrecognized',
];
const checks = [
  ['all filesystem-derived discovery blockers retain failure: unknown', evidenceKinds.every(kind => new RegExp(`kind: '${kind}'[^\\n]*failure: unknown`).test(upstream))],
  ['existing blocker factories accept and attach original failure evidence', /rootMissing: \(root, failure\)/.test(upstream) && /directoryMissing: \(directory, failure\)/.test(upstream) && /pathNotDirectory: \(directory, failure\)/.test(upstream) && /directoryUnreadable: \(directory, failure\)/.test(upstream) && /failureCodeUnrecognized: \(directory, failure\)/.test(upstream)],
  ['filesystem failure operation forwards failure into every blocker factory', evidenceKinds.filter(kind => kind !== 'controller_source_discovery_symbolic_link_encountered').every(kind => composition.includes('failure')) && /rootMissing\(root, failure\)/.test(composition) && /directoryMissing\(directory, failure\)/.test(composition) && /pathNotDirectory\(directory, failure\)/.test(composition) && /directoryUnreadable\(directory, failure\)/.test(composition) && /failureCodeUnrecognized\(directory, failure\)/.test(composition)],
  ['lstat and readdir rejection values are passed unchanged alongside classified codes', (composition.match(/nodeFilesystemFailureObservation\.observe\(error\)[\s\S]{0,100}error,/g) || []).length === 2],
  ['discovery contract version is bumped to 4 in upstream and runtime composition', /readonly contractVersion: 4/.test(upstream) && /contractVersion: 4/.test(composition)],
  ['blocker tests assert rejection identity is preserved', (tests.match(/expect\(blocker\.failure\)\.toBe\(originalFailure\)/g) || []).length === 5],
  ['composition has no try/catch control flow', !/\btry\s*\{|\bcatch\s*\(/.test(composition)],
  ['changed runtime files do not add exported function declarations', !/^\s*export\s+function\s/m.test(composition + upstream)],
  ['upstream collections remains empty', collections.length === 0],
  ['audit command is registered', packageJson.scripts['audit:phase2948-discovery-blocker-rejection-evidence'] === 'node scripts/audits/audit-phase2948-discovery-blocker-rejection-evidence.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
