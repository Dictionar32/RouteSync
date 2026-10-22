const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const checks = [
  ['interface exports its own canonical contract value', /export const LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT:\s*LaravelControllerInvocationSemanticJudgmentContract\s*=\s*Object\.freeze/.test(contract)],
  ['canonical contract value and type share version 12', /interface LaravelControllerInvocationSemanticJudgmentContract\s*\{[\s\S]*?readonly version: 12/.test(contract) && /kind: 'laravel_controller_invocation_semantic_judgment_contract',[\s\S]*?version: 12/.test(contract)],
  ['authority re-exports the exact canonical value instead of rebuilding it', /LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT:\s*LaravelControllerInvocationSemanticJudgmentContract\s*=\s*CANONICAL_LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT/.test(authority) && !/\.\.\.CANONICAL_LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT/.test(authority)],
  ['all four integrated-response outcomes remain explicit', ['not_connected', 'source_binding_rejected', 'complete', 'blocked'].every(kind => contract.includes(`php_source_invocation_integration_${kind}`))],
  ['scanner forwards the correlated integrated judgment', /kind: 'integrated_invocation_response_judgment'/.test(scanner) && /responseJudgment[,}]/.test(scanner)],
  ['runtime executor delegates to the upstream authority', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor)],
  ['runtime executor has no invocation outcome classifier', !/switch\s*\([^)]*\.kind|if\s*\([^)]*\.kind/.test(executor)],
  ['relation/foundation subscanner remains absent', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation/foundation'))],
];
let failed = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += pass ? 0 : 1;
}
process.stdout.write(`Phase 2073: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed ? 1 : 0;
