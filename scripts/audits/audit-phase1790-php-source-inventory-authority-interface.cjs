const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const resolution = read('packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const invocation = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const checks = [
  ['source inventory authority is an upstream interface', resolution.includes('interface PhpFunctionResolutionSourceInventoryAuthorityInterface')],
  ['authority consumes parser-produced source inventory evidence', resolution.includes('interface PhpFunctionResolutionSourceInventoryInput') && resolution.includes('coverage: PhpFunctionResolutionSourceInventoryCoverage')],
  ['whole-file parser coverage is a closed complete/incomplete judgment', resolution.includes("kind: 'php_function_resolution_source_inventory_coverage_complete'") && resolution.includes("kind: 'php_function_resolution_source_inventory_coverage_incomplete'")],
  ['coverage requires every namespace, import, declaration, and region boundary', resolution.includes('all-namespace-region-declarations-visited') && resolution.includes('all-import-declarations-visited-per-region') && resolution.includes('all-named-function-declarations-visited-per-region') && resolution.includes('all-region-boundaries-accounted-for')],
  ['authority contract orders source binding and coverage validation before publication', resolution.includes('require-source-file-and-whole-file-span-identity') && resolution.includes('require-parser-issued-whole-file-coverage-evidence') && resolution.includes('publish-complete-inventory-only-when-all-obligations-hold')],
  ['namespace-prefix imports remain separate from function imports', resolution.includes('keep-namespace-prefix-imports-distinct-from-function-imports')],
  ['method-body-only evidence cannot certify a complete file inventory', resolution.includes('never-certify-method-body-only-evidence-as-a-whole-file-inventory')],
  ['pending state explicitly names authority-to-resolution binding blocker', invocation.includes('source-wide-namespace-inventory-authority-not-connected-to-name-resolution')],
  ['pending state explicitly names namespace-region-to-batch binding blocker', invocation.includes('namespace-region-inventory-not-bound-to-invocation-batch')],
  ['integrated response keeps the existing typed PHP invocation slot', pipeline.includes('phpFunctionInvocations: PhpFunctionInvocationSemanticIntegrationState')],
  ['scanner remains an injected-contract consumer with no direct pending selection', scanner.includes('phpFunctionInvocations });') && !scanner.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING')],
  ['composition root retains explicit pending state until real evidence is connected', binding.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING')],
  ['interface introduces no semantic foundation or relations dependency', !resolution.includes('semantic/foundation') && !resolution.includes('semantic/relations')],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
