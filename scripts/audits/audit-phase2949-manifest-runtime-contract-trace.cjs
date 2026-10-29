const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const compositionPath = 'packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts';
const compositionInterfacePath = 'packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts';
const discoveryContractPath = 'packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts';
const upstreamBarrelPath = 'packages/core/src/types/upstream/index.ts';
const composition = read(compositionPath);
const compositionInterface = read(compositionInterfacePath);
const discoveryContract = read(discoveryContractPath);
const upstreamBarrel = read(upstreamBarrelPath);
const sourceIdentity = read('packages/core/src/types/upstream/sourceProjectIdentity.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const runtimeExportNames = [
  'controllerSourceProjectIdentityCanonicalization',
  'controllerInvocationManifestTerminalOperationsFactory',
  'controllerInvocationManifestCompositionAuthorityFactory',
  'controllerInvocationManifestCompositionAuthority',
  'controllerInvocationManifestBuilder',
];
const checks = [
  ['public manifest builder is interface-first and frozen', /export const controllerInvocationManifestBuilder:\s*ControllerInvocationManifestBuilderInterface\s*=\s*Object\.freeze\(/.test(composition)],
  ['composition authority factory is interface-first and frozen', /export const controllerInvocationManifestCompositionAuthorityFactory:\s*ControllerInvocationManifestCompositionAuthorityFactoryInterface\s*=\s*Object\.freeze\(/.test(composition)],
  ['terminal operation factory is interface-first and frozen', /export const controllerInvocationManifestTerminalOperationsFactory:\s*ControllerInvocationManifestTerminalOperationsFactoryInterface\s*=\s*Object\.freeze\(/.test(composition)],
  ['source-project canonicalization runtime is interface-first and frozen', /export const controllerSourceProjectIdentityCanonicalization:\s*ControllerSourceProjectIdentityCanonicalizationInterface\s*=\s*Object\.freeze\(/.test(composition)],
  ['no exported function declarations in manifest runtime path', !/^\s*export\s+(?:async\s+)?function\s/m.test(composition + compositionInterface)],
  ['runtime export names each have an explicit interface contract', runtimeExportNames.every(name => composition.includes(name + ':') || new RegExp('const\\s+' + name + '\\s*:\\s*').test(composition))],
  ['canonicalization success and rejection ADTs both own continueWith', /kind: 'controller_source_project_identity_canonicalized'[\s\S]{0,260}continueWith/.test(composition) && /kind: 'controller_source_project_identity_canonicalization_blocked'[\s\S]{0,520}continueWith/.test(composition)],
  ['manifest terminal judgments route through continueForDriftAudit operations', /continueForDriftAudit: handlers => handlers\.complete\(judgment\)/.test(composition) && /continueForDriftAudit: handlers => handlers\.sourceDiscoveryBlocked\(judgment\)/.test(composition)],
  ['filesystem discovery contract is explicitly exported from upstream barrel', /export \* from '\.\/laravelControllerInvocationSemanticJudgmentInventoryInterface'/.test(upstreamBarrel)],
  ['filesystem rejection ADT keeps executable continuation and original failure evidence', /controller_source_discovery_directory_unreadable[\s\S]{0,160}failure: unknown/.test(discoveryContract) && /continueWith:/.test(discoveryContract)],
  ['existing source identity contract is not misrepresented as filesystem canonicalization', /relateSourceProjects:/.test(sourceIdentity) && !/realpath|canonicalize:/.test(sourceIdentity)],
  ['upstream collections remains empty', collections.length === 0],
  ['phase2949 audit command is registered', packageJson.scripts['audit:phase2949-manifest-runtime-contract-trace'] === 'node scripts/audits/audit-phase2949-manifest-runtime-contract-trace.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
