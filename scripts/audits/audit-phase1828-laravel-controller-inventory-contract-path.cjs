const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const inventory = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const authority = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentAuthority.ts');
const scanner = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const packageRoot = read('packages/core/src/index.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const routeScanner = read('packages/core/src/compiler/scanner/operations/RouteScanner.ts');
const resourceScanner = read('packages/core/src/compiler/scanner/operations/ResourceScanner.ts');
const scripts = JSON.parse(read('package.json')).scripts;
const checks = [
  ['inventory contract has an explicit ordered closure protocol', /readonly closureOrder: readonly \[[\s\S]*?validate-source-inventory-completeness-and-project-binding[\s\S]*?validate-canonical-source-identity-uniqueness[\s\S]*?validate-exactly-one-judgment-per-controller-source[\s\S]*?reject-judgments-outside-the-controller-source-inventory[\s\S]*?publish-only-a-receipt-bearing-validated-result/.test(inventory)],
  ['contract declares authority enforcement and forbids scanner repair', /authority-executes-this-closed-contract-without-semantic-foundation-or-semantic-relations-dependencies-and-scanner-never-revalidates-or-repairs-the-receipt/.test(inventory)],
  ['validated inventory is represented by a dedicated closure receipt', /interface LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(inventory)],
  ['receipt retains source inventory and source-correlated judgments together', /readonly sourceInventory: LaravelControllerSourceInventoryInterface/.test(inventory) && /readonly correspondences: readonly LaravelControllerInvocationSemanticJudgmentInterface\[\]/.test(inventory)],
  ['receipt does not duplicate source identity beside judgment', /readonly correspondences: readonly LaravelControllerInvocationSemanticJudgmentInterface\[\]/.test(inventory) && !/interface LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt[\s\S]*?readonly sourceFile: SourceFile/.test(inventory)],
  ['validated and rejected outcomes are a closed ADT at contract version 4', /kind: 'laravel_controller_invocation_semantic_judgment_inventory_validated'[\s\S]*?contractVersion: 4[\s\S]*?receipt: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(inventory) && /kind: 'laravel_controller_invocation_semantic_judgment_inventory_rejected'[\s\S]*?contractVersion: 4/.test(inventory)],
  ['rejection ledger cannot be empty', /readonly rejections: readonly \[[\s\S]*?LaravelControllerInvocationSemanticJudgmentInventoryRejection,/.test(inventory)],
  ['missing, duplicate, and out-of-inventory cases have distinct rejection variants', /controller_source_inventory_contains_duplicate_source/.test(inventory) && /controller_source_has_no_invocation_judgment/.test(inventory) && /controller_source_has_multiple_invocation_judgments/.test(inventory) && /invocation_judgment_is_outside_controller_source_inventory/.test(inventory)],
  ['completeness witness requires explicit empty-inventory certification', /empty-controller-source-set-is-explicitly-certified-when-applicable/.test(inventory)],
  ['judgment keeps source identity and integrated response correlated', /readonly sourceFile: SourceFile/.test(judgment) && /readonly response: PhpSourceInvocationSemanticPipelineIntegrationResult/.test(judgment)],
  ['integration outcome ownership remains upstream', /dependencies\.integration\.project/.test(authority) && /PhpSourceInvocationSemanticPipelineIntegrationResult/.test(judgment)],
  ['scanner input accepts closure receipt, not result union or raw array', /readonly invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(scanner) && !/readonly invocationInventory: Extract</.test(scanner) && !/readonly invocationJudgments: readonly/.test(scanner)],
  ['scanner contract is v7', /readonly contractVersion: 7/.test(scanner) && /interface LaravelControllerScanJudgment[\s\S]*?readonly contractVersion: 7/.test(scanner)],
  ['scanner boundary version is 43 and includes receipt-only rule', /readonly version: 43/.test(scanner) && /version: 43,/.test(scanner) && /inventoryReceiptBoundary: 'scanner-receives-the-authority-produced-closure-receipt/.test(scanner)],
  ['upstream barrel exports inventory contract', /export \* from '\.\/laravelControllerInvocationSemanticJudgmentInventoryInterface'/.test(upstreamIndex)],
  ['package root exports receipt and authority contract', /LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(packageRoot) && /LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface/.test(packageRoot)],
  ['no semantic foundation or semantic relations dependency introduced', !/semantic\/(?:foundation|relation|relations)/.test(inventory + judgment + authority + scanner)],
  ['production pipeline still explicitly exposes legacy scanner call', /ControllerScanner\.scanCanonicalBundle/.test(pipeline)],
  ['route scanner legacy controller-index dependency is recorded', /RelationIndex<string, RelationIndex<string, ControllerActionInfo>>/.test(routeScanner)],
  ['resource dataflow legacy dependency is recorded at pipeline boundary', /ControllerScanner\.extractResourceDataflow\(controllerBundle\.controllerIndex\)/.test(pipeline)],
  ['audit command is registered', scripts['audit:phase1828-laravel-controller-inventory-contract-path'] === 'node scripts/audits/audit-phase1828-laravel-controller-inventory-contract-path.cjs'],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!pass);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed.\n`);
process.stdout.write('Status: the closure contract is now implemented by the Phase 1829 authority; production wiring remains legacy and is not claimed migrated.\n');
process.exitCode = failures === 0 ? 0 : 1;
