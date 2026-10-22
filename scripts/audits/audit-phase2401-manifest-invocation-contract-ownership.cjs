const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const manifest = read('packages/core/src/types/upstream/manifest.ts');
const builder = read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts');
const flow = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const cliScan = read('packages/cli/src/commands/scan.ts');
const cliSync = read('packages/cli/src/commands/sync.ts');
const checks = [
  ['concrete manifest owns the existing invocation judgment ADT', () => manifest.includes('readonly invocationSemanticJudgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[];')],
  ['manifest builder forwards judgments directly from the authority-closed receipt', () => builder.includes('invocationSemanticJudgments: invocationInventoryReceipt.correspondences')],
  ['manifest flow projection reads the concrete manifest contract', () => flow.includes('invocationSemanticJudgments: manifest.invocationSemanticJudgments')],
  ['manifest flow projection does not reach into the AST', () => !flow.includes('manifest.ast')],
  ['manifest construction preserves receipt correspondence identity without remapping', () => !builder.includes('invocationInventoryReceipt.correspondences.map')],
  ['scan CLI consumes the AST-free manifest flow contract', () => cliScan.includes('manifestFlow.invocationSemanticJudgments') && !cliScan.includes('completeManifest.ast')],
  ['sync CLI consumes the AST-free manifest flow contract', () => cliSync.includes('manifestFlow.invocationSemanticJudgments') && !cliSync.includes('completeManifest.ast')],
  ['no semantic foundation dependency added to the modified upstream path', () => ![manifest, builder, flow].some(source => source.includes('semantic/foundation'))],
  ['no new invocation judgment type was introduced', () => !manifest.includes('interface RouteSyncManifestInvocationJudgment') && !manifest.includes('type RouteSyncManifestInvocationJudgment')],
];
let failures = 0;
for (const [name, check] of checks) {
  const passed = check();
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
