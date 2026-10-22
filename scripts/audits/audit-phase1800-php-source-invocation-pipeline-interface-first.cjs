const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const pipeline = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineInterface.ts');
const frontend = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const validation = read('packages/core/src/types/upstream/phpSourceFrontendValidationAuthorityInterface.ts');
const inventory = read('packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const invocation = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['pipeline interface is an upstream contract', /interface PhpSourceInvocationSemanticPipelineInterface/.test(pipeline)],
  ['pipeline accepts the typed PHP source document', /analyze: \(document: PhpSourceDocument\)/.test(pipeline)],
  ['pipeline stage order begins with frontend extraction', /extract-whole-file-source-evidence-through-frontend-interface/.test(pipeline)],
  ['validation is an explicit stage before inventory', /validate-extraction-provenance-and-coverage/.test(pipeline) && /validate-whole-file-namespace-import-and-declaration-inventory/.test(pipeline)],
  ['name resolution precedes invocation batch closure', /derive-name-resolution-judgments-from-source-bound-environments/.test(pipeline) && /derive-and-close-total-invocation-judgment-batch/.test(pipeline)],
  ['complete result requires complete frontend validation', /PhpSourceFrontendCompleteValidation/.test(pipeline) && /completeness: 'complete'/.test(pipeline)],
  ['complete result requires complete source inventory', /php_function_resolution_source_inventory_complete/.test(pipeline)],
  ['complete result requires validated invocation batch', /php_function_invocation_semantic_judgment_batch_validated/.test(pipeline)],
  ['validation rejection has a distinct blocked result', /stage: 'frontend_validation'/.test(pipeline) && /php_source_frontend_extraction_rejected/.test(pipeline)],
  ['incomplete coverage cannot become complete result', /stage: 'frontend_coverage'/.test(pipeline) && /completeness: 'incomplete'/.test(pipeline)],
  ['incomplete inventory and rejected closure remain explicit', /stage: 'source_inventory'/.test(pipeline) && /stage: 'invocation_batch_closure'/.test(pipeline)],
  ['frontend is constrained to syntax evidence and no semantic judgments', /never-resolve-names-or-create-invocation-judgments-in-the-frontend/.test(frontend)],
  ['inventory authority remains the owner of whole-file inventory validation', /interface PhpFunctionResolutionSourceInventoryAuthorityInterface/.test(inventory)],
  ['invocation batch remains the owner of total correspondence closure', /require-total-inventory-to-judgment-correspondence/.test(invocation)],
  ['scanner runtime has not been silently rewired to a fake frontend', /invocationSemanticIntegratedResponseComposition\.integrate/.test(scanner) && !/PhpSourceInvocationSemanticPipelineInterface/.test(scanner)],
  ['new interface is exported through upstream index', /export \* from '\.\/phpSourceInvocationSemanticPipelineInterface'/.test(index)],
  ['interface contract has no semantic foundation or relations dependency', !/semantic\/(foundation|relations)/.test(pipeline)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`Phase 1800: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
