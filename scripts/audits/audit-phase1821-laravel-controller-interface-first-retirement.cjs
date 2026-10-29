const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const controller = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const inventory = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts');
const retirement = read('packages/core/src/types/upstream/laravelSubscannerRetirementInterface.ts');
const coreExports = read('packages/core/src/index.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const routeScanner = read('packages/core/src/compiler/scanner/operations/RouteScanner.ts');
const legacyScanner = read('packages/core/src/compiler/scanner/operations/ControllerScanner.ts');
const checks = [
  ['controller interface version is elevated to v7', /contractVersion: 7/.test(controller)],
  ['scanner boundary accepts validated judgment inventory instead of raw delivery ADTs', /invocationInventory: LaravelControllerInvocationSemanticJudgmentInventoryClosureReceipt/.test(controller) && !/source_correlated_delivery_inventory_provided|controller_source_pipeline_result_provided/.test(controller)],
  ['inventory contract closes source-to-judgment correspondence', /LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface/.test(inventory) && /exactly-one-judgment-per-controller-source/.test(inventory) && /readonly close:/.test(inventory)],
  ['controller artifact receives source identity through the nested semantic judgment', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(controller) && /readonly sourceFile: SourceFile/.test(read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts'))],
  ['controller artifact retains integrated invocation response inside the correlated judgment', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(controller) && /readonly response: PhpSourceInvocationSemanticPipelineIntegrationResult/.test(read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts'))],
  ['controller judgment is version-aligned', /LaravelControllerScanJudgment[\s\S]*?contractVersion: 7/.test(controller)],
  ['boundary declares subscanner retirement target', /retire-controller-subscanner-after-upstream-interface-owns-source-artifacts-and-integrated-invocation-response/.test(controller)],
  ['boundary blocks deletion until interface is implemented and consumers migrate', /retirementBoundary: 'ControllerScanner-is-not-deletable-until-the-upstream-interface-is-implemented-and-all-production-consumers-use-its-correlated-judgment'/.test(controller)],
  ['retirement contract gates directory deletion on zero production consumers', /delete-legacy-subscanner-directory-only-after-zero-production-consumers-and-audit-passes/.test(retirement)],
  ['validated invocation inventory contract is exported from core', /LaravelControllerInvocationSemanticJudgmentInventoryAuthorityInterface/.test(coreExports)],
  ['trace confirms pipeline still directly calls legacy controller scanner', /ControllerScanner\.scanCanonicalBundle/.test(pipeline)],
  ['trace confirms route scanner still depends on legacy controller action index', /RelationIndex<string, RelationIndex<string, ControllerActionInfo>>/.test(routeScanner)],
  ['trace confirms legacy scanner still owns source parsing and action aggregation', /class ControllerScanner/.test(legacyScanner) && /scanOnce/.test(legacyScanner)],
];
let failures = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!pass);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed.\n`);
process.stdout.write('Retirement status: BLOCKED — inventory authority now enforces the receipt contract, but production wiring and route/resource consumers still depend on the legacy ControllerScanner/index.\n');
process.exitCode = failures === 0 ? 0 : 1;
