const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const inventory = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const rootExports = read('packages/core/src/index.ts');
const upstreamExports = read('packages/core/src/types/upstream/index.ts');
const production = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const scripts = JSON.parse(read('package.json')).scripts;
const checks = [
  ['scanner contract is v7', /readonly contractVersion: 7/.test(scanner)],
  ['scan judgment contract is v7', /interface LaravelControllerScanJudgment[\s\S]*?readonly contractVersion: 7/.test(scanner)],
  ['scanner accepts authority closure receipt directly', /readonly invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(scanner)],
  ['scanner no longer accepts a bare judgment array', !/readonly invocationJudgments:\s*readonly LaravelControllerInvocationSemanticJudgmentInterface\[\]/.test(scanner)],
  ['controller source project is not duplicated outside the validated inventory', !/interface LaravelControllerScanInput[\s\S]*?readonly sourceProject: SourceProjectIdentity/.test(scanner)],
  ['inventory requires source-project-bound source inventory', /readonly sourceProject: SourceProjectIdentity/.test(inventory) && /readonly sources: readonly SourceFile\[\]/.test(inventory)],
  ['empty controller source set requires explicit completeness witness', /empty-controller-source-set-is-explicitly-certified-when-applicable/.test(inventory)],
  ['inventory authority contract requires total one-to-one correspondence', /each-controller-source-has-exactly-one-judgment/.test(inventory) && /no-judgment-exists-outside-the-controller-source-inventory/.test(inventory)],
  ['inventory result has validated and rejected discriminated variants', /laravel_controller_invocation_semantic_judgment_inventory_validated/.test(inventory) && /laravel_controller_invocation_semantic_judgment_inventory_rejected/.test(inventory)],
  ['rejected inventory requires a non-empty typed rejection ledger', /readonly rejections: readonly \[[\s\S]*?LaravelControllerInvocationSemanticJudgmentInventoryRejection,/.test(inventory)],
  ['rejection variants preserve duplicate, missing, and extra judgments', /controller_source_inventory_contains_duplicate_source/.test(inventory) && /controller_source_has_no_invocation_judgment/.test(inventory) && /controller_source_has_multiple_invocation_judgments/.test(inventory) && /invocation_judgment_is_outside_controller_source_inventory/.test(inventory)],
  ['integrated response variants remain upstream-owned', /PhpSourceInvocationSemanticPipelineIntegrationResult/.test(judgment) && /dependencies\.integration\.project/.test(authority)],
  ['source identity remains canonical on the judgment', /readonly sourceFile: SourceFile/.test(judgment) && /source-identity-and-integrated-response-are-one-judgment-value/.test(judgment)],
  ['boundary contract and constant are v43', /readonly version: 43/.test(scanner) && /version: 43/.test(scanner)],
  ['boundary contract interface fields and constant stay aligned', (() => { const i = scanner.slice(scanner.indexOf('export interface LaravelControllerInvocationSemanticBoundaryContract'), scanner.indexOf('export const LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_BOUNDARY_CONTRACT')); const o = scanner.slice(scanner.indexOf('export const LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_BOUNDARY_CONTRACT')); const ik = [...i.matchAll(/readonly (\w+):/g)].map(x => x[1]); const ok = [...o.matchAll(/^\s{2}(\w+):/gm)].map(x => x[1]); return ik.length === ok.length && ik.every(k => ok.includes(k)) && ok.every((k, n) => ok.indexOf(k) === n); })()],
  ['boundary explicitly forbids unvalidated judgment arrays', /never-accepts-an-unvalidated-judgment-array/.test(scanner)],
  ['upstream barrel exports inventory contract', /export \* from '\.\/laravelControllerInvocationSemanticJudgmentInventoryInterface'/.test(upstreamExports)],
  ['package root exports inventory closure receipt and authority types', /LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(rootExports) && /LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface/.test(rootExports) && /LARAVEL_CONTROLLER_INVOCATION_SEMANTIC_JUDGMENT_INVENTORY_CONTRACT/.test(rootExports)],
  ['no semantic foundation dependency introduced', !/semantic\/foundation/.test(scanner + inventory + judgment + authority)],
  ['production remains truthfully marked legacy', /ControllerScanner\.scanCanonicalBundle/.test(production)],
  ['audit command is registered', scripts['audit:phase1827-laravel-controller-judgment-inventory-interface'] === 'node scripts/audits/audit-phase1827-laravel-controller-judgment-inventory-interface.cjs'],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!pass);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed.\n`);
process.stdout.write('Status: this interface boundary is now backed by the Phase 1829 inventory authority; production wiring remains legacy and is not claimed migrated.\n');
process.exitCode = failures === 0 ? 0 : 1;
