const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const implementation = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const contract = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const coreBarrel = read('packages/core/src/index.ts');
const upstreamCollections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['canonicalization contract version is incremented', /controller_source_project_identity_canonicalization'[\s\S]{0,100}contractVersion: 2/.test(implementation) && /readonly kind: 'controller_source_project_identity_canonicalization';\s*readonly contractVersion: 2/.test(contract)],
  ['blocked canonicalization ADT includes typed filesystem failure code', /interface ControllerSourceProjectIdentityCanonicalizationBlockedJudgment[\s\S]*?readonly failureCode: FilesystemFailureCode/.test(contract)],
  ['blocked canonicalization ADT includes typed filesystem location', /interface ControllerSourceProjectIdentityCanonicalizationBlockedJudgment[\s\S]*?readonly location: FilesystemFailureLocation/.test(contract)],
  ['original realpath rejection evidence is retained unchanged', /failureCode: nodeFilesystemFailureObservation\.observe\(failure\),[\s\S]{0,180}failure,/.test(implementation)],
  ['realpath failure classification reuses existing filesystem ADT', /failureCode: nodeFilesystemFailureObservation\.observe\(failure\)/.test(implementation) && /export \* from '\.\/types\/upstream\/filesystemFailureInterface'/.test(coreBarrel)],
  ['realpath failure location is the requested project root', /location: filesystemFailureLocationFactory\.root\(createSourceFile\(input\.sourceProject\.root\.value\.value\)\)/.test(implementation)],
  ['canonicalized judgment retains domain continuation', /controller_source_project_identity_canonicalized'[\s\S]{0,900}continueWith: <Result>/.test(implementation)],
  ['blocked judgment retains domain continuation', /controller_source_project_identity_canonicalization_blocked'[\s\S]{0,500}continueWith: <Result>/.test(implementation)],
  ['manifest composition consumes canonicalization through continuation operation', /return identity\.continueWith\(\{[\s\S]{0,400}onBlocked:[\s\S]{0,500}onCanonicalized:/.test(implementation)],
  ['no exported function declarations in scoped runtime modules', !/^\s*export\s+(?:async\s+)?function\s/m.test(implementation + contract)],
  ['canonicalization runtime remains interface-first and frozen', /export const controllerSourceProjectIdentityCanonicalization:\s*ControllerSourceProjectIdentityCanonicalizationInterface\s*=\s*Object\.freeze\(/.test(implementation)],
  ['upstream collections remains empty', upstreamCollections.length === 0],
  ['phase2950 audit command is registered', packageJson.scripts['audit:phase2950-canonicalization-failure-adt'] === 'node scripts/audits/audit-phase2950-canonicalization-failure-adt.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
