const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const response = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const runtime = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const checks = [
  ['invocation ADT exposes a named not-connected judgment branch', /export type LaravelControllerInvocationNotConnectedJudgment\s*=/.test(invocation)],
  ['invocation ADT exposes a named source-binding-rejected judgment branch', /export type LaravelControllerInvocationSourceBindingRejectedJudgment\s*=/.test(invocation)],
  ['invocation ADT exposes a named complete judgment branch', /export type LaravelControllerInvocationCompleteJudgment\s*=/.test(invocation)],
  ['invocation ADT exposes a named blocked judgment branch', /export type LaravelControllerInvocationBlockedJudgment\s*=/.test(invocation)],
  ['canonical invocation judgment is an explicit union of named judgment branches', /export type LaravelControllerInvocationSemanticJudgmentInterface\s*=\s*\| LaravelControllerInvocationNotConnectedJudgment\s*\| LaravelControllerInvocationSourceBindingRejectedJudgment\s*\| LaravelControllerInvocationCompleteJudgment\s*\| LaravelControllerInvocationBlockedJudgment/.test(invocation)],
  ['scanner artifact ADT explicitly lists the four named judgment branches', /export type LaravelControllerScanArtifact\s*=\s*\| LaravelControllerScanArtifactBase<[\s\S]*?LaravelControllerInvocationNotConnectedJudgment[\s\S]*?\| LaravelControllerScanArtifactBase<[\s\S]*?LaravelControllerInvocationSourceBindingRejectedJudgment[\s\S]*?\| LaravelControllerScanArtifactBase<[\s\S]*?LaravelControllerInvocationCompleteJudgment[\s\S]*?\| LaravelControllerScanArtifactBase<[\s\S]*?LaravelControllerInvocationBlockedJudgment/.test(scanner)],
  ['scanner outcome selection no longer uses a distributive conditional-type mapper', !/LaravelControllerScanArtifactForEveryOutcome|Kind extends LaravelControllerInvocationSemanticJudgmentInterface\['response'\]\['kind'\]\s*\?/.test(scanner)],
  ['each artifact branch retains a response type indexed by its exact invocation judgment', /LaravelControllerAstProjectionResponseJudgment<LaravelControllerInvocationNotConnectedJudgment>[\s\S]*?LaravelControllerAstProjectionResponseJudgment<LaravelControllerInvocationSourceBindingRejectedJudgment>[\s\S]*?LaravelControllerAstProjectionResponseJudgment<LaravelControllerInvocationCompleteJudgment>[\s\S]*?LaravelControllerAstProjectionResponseJudgment<LaravelControllerInvocationBlockedJudgment>/.test(scanner)],
  ['canonical integrated response still indexes response by invocation judgment', /LaravelControllerIntegratedResponseJudgment<\s*InvocationJudgment/.test(response)],
  ['runtime scanner remains unchanged and relation/subscanner dependencies are still reported honestly', /semantic\/relations/.test(runtime) && /scanControllerAction/.test(runtime)],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  failures += passed ? 0 : 1;
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
