const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const inventoryAuthority = read('packages/core/src/types/upstream/phpFunctionResolutionSourceInventoryAuthority.ts');
const projection = read('packages/core/src/types/upstream/phpFunctionResolutionEnvironmentProjectionAuthority.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const nameAuthority = read('packages/core/src/types/upstream/phpFunctionNameResolutionAuthority.ts');
const invocation = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const checks = [
  ['environment projection is defined in the existing PHP name-resolution contract module', contract.includes('PhpFunctionResolutionEnvironmentProjectionInterface') && contract.includes('PhpFunctionResolutionEnvironmentProjectionInput')],
  ['projection has a closed typed complete/incomplete result', contract.includes('php_function_resolution_environment_projection_complete') && contract.includes('php_function_resolution_environment_projection_incomplete')],
  ['projection failure reasons are a closed union', contract.includes("'no-namespace-region-owns-invocation'") && contract.includes("'multiple-namespace-regions-own-invocation'")],
  ['projection contract requires complete inventory before scope selection', contract.includes("'require-complete-source-inventory'")],
  ['projection contract forbids inferring global scope from missing evidence', contract.includes("'never-infer-global-scope-from-missing-region-evidence'")],
  ['complete inventory preserves the whole-file source span', contract.includes("kind: 'php_function_resolution_source_inventory_complete';\n      readonly sourceFile: SourceFile;\n      readonly source: SourceSpan;")],
  ['inventory contract is versioned after the complete-source-span addition', contract.includes('readonly version: 3') && contract.includes('version: 3,')],
  ['inventory authority publishes the certified source span', inventoryAuthority.includes("kind: 'php_function_resolution_source_inventory_complete',\n    sourceFile: input.sourceFile,\n    source: input.source,")],
  ['projection rejects incomplete source inventory', projection.includes("input.inventory.kind !== 'php_function_resolution_source_inventory_complete'")],
  ['projection binds invocation to inventory source file', projection.includes('sameFile(input.inventory.sourceFile, input.invocationSource.file)')],
  ['projection binds invocation span to certified whole-file span', projection.includes('spanWithin(input.invocationSource, input.inventory.source)')],
  ['projection requires a non-empty valid source span', projection.includes('span.end.value > span.start.value')],
  ['projection requires exactly one owning namespace region', projection.includes('regions.length === 0') && projection.includes('regions.length !== 1')],
  ['global and named namespace regions map to their existing closed scope variants', projection.includes("kind: 'global_function_scope'") && projection.includes("kind: 'namespaced_function_scope'")],
  ['projection reuses region-bound imports, declarations, and completeness witness', projection.includes('namespaceImports: region.namespaceImports') && projection.includes('imports: region.functionImports') && projection.includes('completeness: region.completeness')],
  ['projection authority uses the canonical interface contract', projection.includes('PHP_FUNCTION_RESOLUTION_ENVIRONMENT_PROJECTION_CONTRACT')],
  ['projection authority is exported through upstream index', upstreamIndex.includes("phpFunctionResolutionEnvironmentProjectionAuthority } from './phpFunctionResolutionEnvironmentProjectionAuthority'")],
  ['name-resolution authority remains the owner of name lookup', nameAuthority.includes('PhpFunctionNameResolutionInput') && nameAuthority.includes('const resolve =')],
  ['existing integrated response retains its PHP invocation slot', pipeline.includes('phpFunctionInvocations: PhpFunctionInvocationSemanticIntegrationState')],
  ['scanner consumes injected integration state without choosing pending itself', scanner.includes('phpFunctionInvocations });') && !scanner.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING')],
  ['pending state remains explicit until real file inventory is wired', binding.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING') && invocation.includes('whole-file-namespace-region-inventory-not-available-to-method-body-scanner') && invocation.includes('resolution-environment-projection-not-connected-to-name-resolution-input')],
  ['new implementation adds no semantic foundation or relations dependency', !projection.includes('semantic/foundation') && !projection.includes('semantic/relations')],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
