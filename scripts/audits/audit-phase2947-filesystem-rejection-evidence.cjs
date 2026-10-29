const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const compositionContract = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['manifest composition contains no try/catch control flow', !/\btry\s*\{|\bcatch\s*\(/.test(composition)],
  ['canonicalization blocked judgment retains original rejection evidence in the upstream contract', /controller_source_project_identity_canonicalization_blocked'[\s\S]*?requested: input\.sourceProject,[\s\S]*?failure,/.test(composition) && /readonly failure: unknown/.test(compositionContract)],
  ['canonicalization rejection callback receives the original failure value', /\.then\([\s\S]*?failure => \{[\s\S]*?kind: 'controller_source_project_identity_canonicalization_blocked'[\s\S]*?failure,/.test(composition)],
  ['filesystem observation accepts unknown rejection evidence', /readonly observe: \(thrownValue: unknown\) => FilesystemFailureCode/.test(composition)],
  ['filesystem observation guards unknown before reading platform code', /typeof thrownValue === 'object' && thrownValue !== null && 'code' in thrownValue/.test(composition)],
  ['filesystem rejection is not replaced with a synthetic Error', !/new Error\(\)|error instanceof Error/.test(composition)],
  ['lstat and readdir pass original rejection evidence to the observer', (composition.match(/nodeFilesystemFailureObservation\.observe\(error\)/g) || []).length === 2],
  ['runtime composition uses interface-first const exports, not exported function declarations', !/^\s*export\s+function\s/m.test(composition) && /export const controllerSourceProjectIdentityCanonicalization:\s*ControllerSourceProjectIdentityCanonicalizationInterface/.test(composition)],
  ['upstream collections remains empty', collections.length === 0],
  ['audit command is registered', packageJson.scripts['audit:phase2947-filesystem-rejection-evidence'] === 'node scripts/audits/audit-phase2947-filesystem-rejection-evidence.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
