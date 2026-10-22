const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const exists = file => fs.existsSync(path.join(root, file));
const checks = [];
const check = (name, passed, detail) => checks.push({ name, passed: Boolean(passed), detail });

const upstream = 'packages/core/src/types/upstream';
const semantic = 'packages/core/src/compiler/semantic/request-type-derivation';
const upstreamBarrel = read(`${upstream}/index.ts`);
const contract = read(`${upstream}/requestTypeDerivationInterface.ts`);
const assembler = read(`${semantic}/requestTypeDerivationSemanticPipelineAssembler.ts`);
const coreBarrel = read('packages/core/src/index.ts');

const relocated = [
  ['requestTypeDerivationAuthorityIntegrityRuntime.ts', 'requestTypeDerivationAuthorityIntegrity.ts'],
  ['requestTypeDerivationAssessmentIntegrityRuntime.ts', 'requestTypeDerivationAssessmentIntegrity.ts'],
  ['requestTypeDerivationAuthorityIntegrityGate.ts', 'requestTypeDerivationAuthorityIntegrityGate.ts'],
];
check(
  'integrity-executors-owned-by-semantic-implementation-layer',
  relocated.every(([oldName, newName]) => !exists(`${upstream}/${oldName}`) && exists(`${semantic}/${newName}`)),
  relocated.map(([oldName, newName]) => `${oldName} -> ${newName}`).join('; '),
);
check(
  'upstream-barrel-does-not-export-relocated-runtime-implementations',
  !upstreamBarrel.includes('requestTypeDerivationAuthorityIntegrityRuntime')
    && !upstreamBarrel.includes('requestTypeDerivationAssessmentIntegrityRuntime')
    && !upstreamBarrel.includes("export * from './requestTypeDerivationAuthorityIntegrityGate'"),
  'upstream barrel retains contract exports; integrity executor exports removed',
);
check(
  'gate-interface-and-result-owned-by-upstream-contract',
  contract.includes('export interface RequestTypeDerivationAuthorityIntegrityGateInterface')
    && contract.includes('export type RequestTypeDerivationAuthorityIntegrityGateResult'),
  'gate operation interface and closed result ADT are declared in requestTypeDerivationInterface.ts',
);
check(
  'assembler-wires-relocated-executors-directly',
  assembler.includes("from './requestTypeDerivationAssessmentIntegrity'")
    && assembler.includes("from './requestTypeDerivationAuthorityIntegrityGate'"),
  'pipeline assembly imports implementations from compiler/semantic/request-type-derivation',
);
check(
  'public-runtime-exports-follow-implementation-owner',
  coreBarrel.includes("from './compiler/semantic/request-type-derivation/requestTypeDerivationAuthorityIntegrityGate'")
    && coreBarrel.includes("from './compiler/semantic/request-type-derivation/requestTypeDerivationAuthorityIntegrity'"),
  'public API exports executable operations from semantic implementation layer',
);
check(
  'cli-semantic-authority-gaps-remain-explicit',
  !read('packages/cli/src/index.ts').includes('const program = createProgram()')
    && /does not ship concrete production reasoning\/verifier\//.test(read(`${semantic}/requestTypeDerivationProductionComposition.ts`))
    && /loadRouteSyncStandaloneComposition/.test(read('packages/cli/src/index.ts'))
    && /ROUTESYNC_UPSTREAM_COMPOSITION_MODULE/.test(read('packages/cli/src/standaloneCompositionLoader.ts'))
    && /requestTypeDerivationSemanticComposition/.test(read('packages/cli/src/standaloneCompositionLoader.ts')),
  'producer and complete verifier gaps remain explicit; standalone root loads a host-owned composition and remains fail-closed',
);

for (const result of checks) process.stdout.write(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}: ${result.detail}\n`);
const failed = checks.filter(result => !result.passed);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} ownership assertions passed.\n`);
if (failed.length) process.exitCode = 1;
