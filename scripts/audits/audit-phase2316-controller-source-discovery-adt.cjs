const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const upstream = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const composition = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const contract = read('packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts');
const consumers = ['packages/cli/src/commands/scan.ts', 'packages/cli/src/commands/sync.ts', 'packages/cli/src/commands/audit/driftAuditor.ts'].map(read).join('\n');
const checks = [
  ['upstream source discovery interface is closed and versioned', /interface LaravelControllerSourceDiscoveryInterface[\s\S]*readonly closed: true[\s\S]*readonly contractVersion: 1[\s\S]*readonly discover:/.test(upstream)],
  ['discovery result distinguishes complete from blocked', /kind: 'laravel_controller_source_discovery_complete'[\s\S]*kind: 'laravel_controller_source_discovery_blocked'/.test(upstream)],
  ['blocked discovery retains partial source identities and typed blocker', /partialSources: readonly SourceFile\[\][\s\S]*blocker: LaravelControllerSourceDiscoveryBlocker/.test(upstream)],
  ['filesystem executor is wired through the upstream interface', /const controllerSourceDiscovery: LaravelControllerSourceDiscoveryInterface/.test(composition) && /controllerSourceDiscovery\.discover\(/.test(composition)],
  ['filesystem failures return typed blockers rather than empty arrays', /filesystemFailure[\s\S]*kind: 'laravel_controller_source_discovery_blocked'/.test(composition) && !/catch \(error: unknown\) \{\s*if \(error instanceof Error && 'code' in error && error\.code === 'ENOENT'\) return Object\.freeze\(\[\]\)/.test(composition)],
  ['directory traversal is deterministic', /\[\.\.\.entries\]\.sort\(\(left, right\) => left\.name\.localeCompare\(right\.name\)\)/.test(composition)],
  ['composition exposes source-discovery blocked terminal ADT', /controller_invocation_manifest_source_discovery_blocked/.test(contract) && /controller_invocation_manifest_source_discovery_blocked/.test(composition)],
  ['scan, sync, and drift audit consume discovery blocker', ['scan', 'sync', 'drift audit'].every(label => label === 'drift audit' ? /controller_invocation_manifest_source_discovery_blocked/.test(read('packages/cli/src/commands/audit/driftAuditor.ts')) : /controller_invocation_manifest_source_discovery_blocked/.test(read(`packages/cli/src/commands/${label}.ts`)))],
  ['Laravel controller scanner still requires upstream inventory receipt', /readonly invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts'))],
  ['no foundation or relations imports introduced on touched path', !/(semantic\/foundation|semantic\/relations)/.test([composition, contract, upstream, consumers].join('\n'))],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
