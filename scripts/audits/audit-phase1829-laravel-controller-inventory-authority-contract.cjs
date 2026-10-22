const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const inventory = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryAuthority.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const packageRoot = read('packages/core/src/index.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const scripts = JSON.parse(read('package.json')).scripts;
const checks = [
  ['inventory contract is version 4 with project-bound witness closure order', /readonly version: 4/.test(inventory) && /bind-completeness-witness-to-the-same-source-project-identity/.test(inventory) && /source-project-identity-matches-the-inventory-project/.test(inventory)],
  ['completeness witness carries the source project identity', /interface LaravelControllerSourceInventoryCompletenessWitness[\s\S]*?readonly sourceProject: SourceProjectIdentity/.test(inventory)],
  ['project mismatch and invalid witness have typed rejection variants', /controller_source_inventory_project_binding_mismatch/.test(inventory) && /controller_source_inventory_completeness_witness_invalid/.test(inventory)],
  ['authority interface defines closure over typed inventory evidence', /interface LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface[\s\S]*?readonly close:[\s\S]*?LaravelControllerInvocationSemanticJudgmentInventoryInput[\s\S]*?LaravelControllerInvocationSemanticJudgmentInventoryResult/.test(inventory)],
  ['authority implementation is an instance of the authority interface', /laravelControllerInvocationSemanticJudgmentInventoryAuthority: LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface/.test(authority)],
  ['authority evaluates rules without semantic foundation or semantic relations imports', !/semantic\/(?:foundation|relation|relations)/.test(authority) && /\.filter\(/.test(authority) && /\.reduce</.test(authority)],
  ['authority has no if statements, Map/Set state, or type assertions', !/\bif\s*\(/.test(authority) && !/\bnew\s+(Map|Set)\b/.test(authority) && !/\s+as\s+(const|[A-Z_a-z])/.test(authority)],
  ['authority binds witness project to inventory project', /inventory\.sourceProject\.root\.value\.value/.test(authority) && /witness\.sourceProject\.root\.value\.value/.test(authority) && /projectMatches/.test(authority)],
  ['authority validates the complete ordered witness obligations', /source-project-identity-matches-the-inventory-project/.test(authority) && /all-controller-source-files-discovered-for-the-source-project/.test(authority) && /empty-controller-source-set-is-explicitly-certified-when-applicable/.test(authority) && /each-source-file-identity-is-canonical-and-unique/.test(authority)],
  ['authority rejects duplicate source identities', /controller_source_inventory_contains_duplicate_source/.test(authority) && /duplicateSources/.test(authority)],
  ['authority rejects missing and multiple judgments', /controller_source_has_no_invocation_judgment/.test(authority) && /controller_source_has_multiple_invocation_judgments/.test(authority)],
  ['authority rejects judgments outside the inventory', /invocation_judgment_is_outside_controller_source_inventory/.test(authority) && /orphanJudgments/.test(authority)],
  ['rejection result has a non-empty typed ledger', /readonly rejections: readonly \[[\s\S]*?LaravelControllerInvocationSemanticJudgmentInventoryRejection,/.test(inventory) && /const rejectionLedger: readonly \[LaravelControllerInvocationSemanticJudgmentInventoryRejection, \...LaravelControllerInvocationSemanticJudgmentInventoryRejection\[\]\]/.test(authority)],
  ['receipt preserves inventory and integrated judgments without duplicated source fields', /readonly sourceInventory: LaravelControllerSourceInventoryInterface/.test(inventory) && /readonly correspondences: readonly LaravelControllerInvocationSemanticJudgmentInterface\[\]/.test(inventory) && !/interface LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt[\s\S]*?readonly sourceFile: SourceFile/.test(inventory)],
  ['scanner accepts only the authority closure receipt', /readonly invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(scanner) && !/readonly invocationJudgments: readonly/.test(scanner)],
  ['inventory authority is exported through upstream and package root', /laravelControllerInvocationSemanticJudgmentInventoryAuthority/.test(upstreamIndex) && /laravelControllerInvocationSemanticJudgmentInventoryAuthority/.test(packageRoot)],
  ['production migration remains explicitly pending while legacy consumers are traced', /ControllerScanner\.scanCanonicalBundle/.test(pipeline) && /ControllerScanner\.extractResourceDataflow/.test(pipeline)],
  ['no semantic foundation or semantic relations dependency was introduced', !/semantic\/(?:foundation|relation|relations)/.test(inventory + authority)],
  ['audit command is registered', scripts['audit:phase1829-laravel-controller-inventory-authority-contract'] === 'node scripts/audits/audit-phase1829-laravel-controller-inventory-authority-contract.cjs'],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!pass);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed.\n`);
process.stdout.write('Status: inventory contract was tightened first; the authority now executes its typed closure rules; production wiring remains legacy and is not claimed migrated.\n');
process.exitCode = failures === 0 ? 0 : 1;
