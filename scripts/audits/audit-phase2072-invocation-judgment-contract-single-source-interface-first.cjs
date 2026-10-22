const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const executor = read('packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts');
const checks = [
  ['interface owns canonical semantic judgment contract version', /interface LaravelControllerInvocationSemanticJudgmentContract\s*\{[\s\S]*?readonly version: 12/.test(contract)],
  ['authority imports the interface-owned canonical contract', /LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT as CANONICAL_LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT/.test(authority)],
  ['authority exports the exact interface-owned contract value', /LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT:\s*LaravelControllerInvocationSemanticJudgmentContract\s*=\s*CANONICAL_LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT/.test(authority) && !/\.\.\.CANONICAL_LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_CONTRACT/.test(authority)],
  ['judgment preserves four exact integrated-response discriminants', ['not_connected', 'source_binding_rejected', 'complete', 'blocked'].every(kind => authority.includes(`case 'php_source_invocation_integration_${kind}'`))],
  ['scanner passes integrated judgment context rather than rebuilding response outcome', /kind: 'integrated_invocation_response_judgment'/.test(scanner) && /responseJudgment[,}]/.test(scanner)],
  ['runtime executor delegates judgment to upstream authority', /execute: \(input: InvocationSemanticInput\): InvocationSemanticJudgment => authority\.analyze\(input\)/.test(executor)],
  ['runtime executor contains no invocation outcome classifier', !/switch\s*\([^)]*\.kind|if\s*\([^)]*\.kind/.test(executor)],
  ['no relation/foundation subscanner introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/subscanners/relation/foundation'))],
];
let failed = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += pass ? 0 : 1;
}
process.stdout.write(`Phase 2072: ${checks.length - failed}/${checks.length}\n`);
process.exitCode = failed ? 1 : 0;
