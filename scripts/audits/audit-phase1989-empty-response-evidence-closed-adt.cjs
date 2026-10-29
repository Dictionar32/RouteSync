const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const contractPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const scannerPath = path.join(root, 'packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const astAuthorityPath = path.join(root, 'packages/core/src/types/upstream/laravelControllerAstProjectionSemanticAuthority.ts');
const contract = fs.readFileSync(contractPath, 'utf8');
const scanner = fs.readFileSync(scannerPath, 'utf8');
const astAuthority = fs.readFileSync(astAuthorityPath, 'utf8');
const checks = [
  ['empty evidence has its own ADT variant', /kind: 'controller_response_evidence_source_binding_empty'[\s\S]*?evidence: readonly \[\]/.test(contract)],
  ['complete binding still requires a non-empty tuple', /kind: 'controller_response_evidence_source_binding_complete'[\s\S]*?evidence: readonly \[[\s\S]*?LaravelControllerResponseEvidenceSameSourceEntry/.test(contract)],
  ['rejected binding still requires explicit different-source evidence', /kind: 'controller_response_evidence_source_binding_rejected'[\s\S]*?LaravelControllerResponseEvidenceDifferentSourceEntry/.test(contract)],
  ['empty outcome is represented in the source-binding contract', /emptyOutcome: 'zero-evidence-is-represented-by-controller_response_evidence_source_binding_empty/.test(contract)],
  ['empty outcome excludes complete response judgment', /readonly kind: 'controller_response_evidence_source_binding_complete' \| 'controller_response_evidence_source_binding_rejected' \| 'controller_response_evidence_source_binding_empty'/.test(contract) && /kind: 'controller_response_evidence_source_binding_empty'[\s\S]*?Extract<[\s\S]*?controller_response_invocation_not_connected[\s\S]*?controller_response_source_binding_rejected[\s\S]*?controller_response_blocked/.test(contract)],
  ['response evidence coverage rule forbids empty-complete success', /zero-evidence-has-an-explicit-empty-outcome-that-cannot-produce-controller_response_complete/.test(contract)],
  ['source-binding contract version advanced', /kind: 'laravel_controller_response_evidence_source_binding_contract'[\s\S]*?contractVersion: 3/.test(contract)],
  ['response authority contract version advanced', /kind: 'laravel_controller_response_semantic_judgment_contract'[\s\S]*?contractVersion: 4/.test(contract)],
  ['AST projection still forwards the exact response judgment', /responseJudgment: context\.responseJudgment/.test(astAuthority)],
  ['runtime scanner remains untouched in this contract-first phase', !/responseJudgment\s*:/.test(scanner)],
  ['no relation/foundation subscanner added', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/controller/semantic/relations')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/controller/semantic/foundation'))],
];
const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} checks passed\n`);
if (failed.length) process.exitCode = 1;
