const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const cliContract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const runtime = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const coreBarrel = read('packages/core/src/index.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['canonicalization judgment contracts are owned by upstream sourceProjectIdentity', /export interface ControllerSourceProjectIdentityCanonicalizedJudgment/.test(upstream) && /export interface ControllerSourceProjectIdentityCanonicalizationBlockedJudgment/.test(upstream)],
  ['blocked ADT retains typed failure code, location, and original failure', /interface ControllerSourceProjectIdentityCanonicalizationBlockedJudgment[\s\S]*?readonly failureCode: FilesystemFailureCode;[\s\S]*?readonly location: FilesystemFailureLocation;[\s\S]*?readonly failure: unknown;/.test(upstream)],
  ['success and blocked ADTs retain domain continuation operations', /ControllerSourceProjectIdentityCanonicalizedJudgment & ControllerSourceProjectIdentityCanonicalizationJudgmentOperations/.test(upstream) && /ControllerSourceProjectIdentityCanonicalizationBlockedJudgment & ControllerSourceProjectIdentityCanonicalizationJudgmentOperations/.test(upstream)],
  ['upstream contract is explicitly exported from core barrel', /ControllerSourceProjectIdentityCanonicalizationInterface/.test(coreBarrel) && /from '\.\/types\/upstream\/sourceProjectIdentity'/.test(coreBarrel)],
  ['CLI composition interface consumes upstream contract instead of redeclaring it', /ControllerSourceProjectIdentityCanonicalizationInterface/.test(cliContract) && !/export interface ControllerSourceProjectIdentityCanonicalizedJudgment/.test(cliContract) && !/export interface ControllerSourceProjectIdentityCanonicalizationBlockedJudgment/.test(cliContract)],
  ['runtime canonicalization remains interface-first and frozen', /export const controllerSourceProjectIdentityCanonicalization:\s*ControllerSourceProjectIdentityCanonicalizationInterface\s*=\s*Object\.freeze\(/.test(runtime)],
  ['runtime preserves original realpath rejection and typed evidence', /failureCode: nodeFilesystemFailureObservation\.observe\(failure\),[\s\S]{0,180}failure,/.test(runtime) && /location: filesystemFailureLocationFactory\.root\(/.test(runtime)],
  ['composition dispatches through judgment continuation, not discriminator switch', /identity\.continueWith\(/.test(runtime) && !/switch\s*\(\s*identity\.kind/.test(runtime)],
  ['no exported function declarations in scoped runtime and contract modules', !/^\s*export\s+(?:async\s+)?function\s/m.test(runtime + cliContract + upstream)],
  ['upstream collections remains empty', collections.length === 0],
  ['Phase2951 audit command is registered', packageJson.scripts['audit:phase2951-upstream-canonicalization-contract'] === 'node scripts/audits/audit-phase2951-upstream-canonicalization-contract.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
