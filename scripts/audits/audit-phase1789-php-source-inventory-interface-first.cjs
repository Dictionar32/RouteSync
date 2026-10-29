const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const resolution = read('packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const invocation = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const checks = [
  ['source inventory is a closed complete/incomplete judgment', resolution.includes("kind: 'php_function_resolution_source_inventory_complete'") && resolution.includes("kind: 'php_function_resolution_source_inventory_incomplete'")],
  ['inventory models namespace regions with their own imports and declarations', resolution.includes('interface PhpNamespaceRegionInventory') && resolution.includes('namespaceImports: PhpNamespaceImports') && resolution.includes('functionImports: PhpFunctionImports') && resolution.includes('declarations: PhpDeclaredFunctions')],
  ['namespace-prefix and function imports remain distinct in the contract', resolution.includes('keep-namespace-prefix-imports-distinct-from-function-imports')],
  ['method-body evidence cannot certify whole-file inventory', resolution.includes('never-certify-method-body-only-evidence-as-a-whole-file-inventory')],
  ['inventory contract requires exact source boundaries and region ownership', resolution.includes('bind-every-region-to-one-source-file-and-exact-source-boundaries') && resolution.includes('bind-every-import-and-declaration-to-exactly-one-region')],
  ['pending state identifies whole-file namespace inventory blocker', invocation.includes('whole-file-namespace-region-inventory-not-available-to-method-body-scanner')],
  ['pending state identifies per-region import inventory blocker', invocation.includes('namespace-prefix-import-and-function-import-declarations-not-inventoried-per-region')],
  ['scanner accepts the typed integration state as an injected contract', scanner.includes('PhpFunctionInvocationSemanticIntegrationState') && scanner.includes('phpFunctionInvocations });')],
  ['composition root owns pending state rather than scanner runtime', binding.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING') && !scanner.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING')],
  ['integrated response reuses existing PHP invocation slot', pipeline.includes('phpFunctionInvocations: PhpFunctionInvocationSemanticIntegrationState')],
  ['no semantic foundation or relation dependency added to resolution interface', !resolution.includes('semantic/foundation') && !resolution.includes('semantic/relations')],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
