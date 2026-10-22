const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [
  ['manifest flow uses the existing closed invocation judgment ADT', () => read('packages/core/src/types/upstream/manifest.ts').includes("import type { LaravelControllerInvocationSemanticJudgmentInterface } from './laravelControllerInvocationSemanticJudgmentInterface'") && read('packages/core/src/types/upstream/manifest.ts').includes('readonly invocationSemanticJudgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[];')],
  ['flow projection forwards the exact judgments from the authority-closed inventory receipt', () => read('packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts').includes('invocationSemanticJudgments: invocationInventoryReceipt.correspondences') && read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts').includes('invocationSemanticJudgments: manifest.invocationSemanticJudgments')],
  ['manifest-flow projection reads the manifest contract and does not reach back into AST construction data', () => !read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts').includes('manifest.ast') && !read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts').includes('controllerScan.controllers.map')],
  ['scan CLI emits invocation judgments as an additive artifact', () => read('packages/cli/src/commands/scan.ts').includes("'routesync.invocations.json'") && read('packages/cli/src/commands/scan.ts').includes('manifestFlow.invocationSemanticJudgments')],
  ['sync CLI emits invocation judgments as an additive artifact', () => read('packages/cli/src/commands/sync.ts').includes("'routesync.invocations.json'") && read('packages/cli/src/commands/sync.ts').includes('manifestFlow.invocationSemanticJudgments')],
  ['CLI serialization forwards judgment outcomes without semantic classification', () => !read('packages/cli/src/commands/scan.ts').includes('response.kind ===') && !read('packages/cli/src/commands/sync.ts').includes('response.kind ===')],
  ['existing integrated response is already part of the invocation judgment contract', () => read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts').includes('readonly response: Extract<PhpSourceInvocationSemanticPipelineIntegrationResult')],
  ['no semantic foundation dependency added on the manifest/CLI path', () => ![read('packages/core/src/types/upstream/manifest.ts'), read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts'), read('packages/cli/src/commands/scan.ts'), read('packages/cli/src/commands/sync.ts')].some(source => source.includes('semantic/foundation'))],
];
let failed = 0;
for (const [name, run] of checks) {
  const ok = run();
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!ok) failed += 1;
}
process.stdout.write(`\n${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
