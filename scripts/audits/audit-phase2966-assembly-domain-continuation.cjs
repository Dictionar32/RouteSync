const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/requestTypeDerivationInterface.ts');
const assembler = read('packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts');
const cli = read('packages/cli/src/upstreamCompositionFactory.ts');
const collections = read('packages/core/src/types/upstream/collections.ts');
const packageJson = JSON.parse(read('package.json'));
const checks = [
  ['upstream assembly ADT declares a domain continuation handler contract', /interface RequestTypeDerivationSemanticPipelineAssemblyHandlers<[\s\S]*?assembled:[\s\S]*?rejected:/.test(contract)],
  ['assembled and rejected variants each expose continueWith', /kind: 'assembled';[\s\S]*?continueWith:[\s\S]*?kind: 'rejected';[\s\S]*?continueWith:/.test(contract)],
  ['assembled runtime value invokes its domain handler', /kind: 'assembled' as const,[\s\S]*?continueWith:[\s\S]*?handlers\.assembled\(pipeline\)/.test(assembler)],
  ['rejected runtime value invokes its domain handler', /kind: 'rejected' as const,[\s\S]*?continueWith:[\s\S]*?handlers\.rejected\(result\)/.test(assembler)],
  ['CLI composition consumes assembly through the ADT operation', /return assembly\.continueWith\(\{/.test(cli)],
  ['CLI composition no longer dispatches on assembly kind', !/switch\s*\(assembly\.kind\)/.test(cli)],
  ['CLI manifest scan operation remains explicitly factory-wired', /routeSyncCliManifestScanOperationFactory\.create\(manifestComposition\)/.test(cli)],
  ['CLI runtime composition export remains interface-first', /export const routeSyncCliUpstreamCompositionFactory: RouteSyncCliUpstreamCompositionFactoryInterface/.test(cli)],
  ['generic upstream collections file remains empty', collections.length === 0],
  ['Phase2966 audit command is registered', packageJson.scripts['audit:phase2966-assembly-domain-continuation'] === 'node scripts/audits/audit-phase2966-assembly-domain-continuation.cjs'],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
console.log(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural checks passed`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
