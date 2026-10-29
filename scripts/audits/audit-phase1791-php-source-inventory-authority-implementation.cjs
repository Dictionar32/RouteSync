const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const authority = read('packages/core/src/types/upstream/phpFunctionResolutionSourceInventoryAuthority.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const invocation = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const checks = [
  ['inventory authority implementation consumes the upstream authority interface', authority.includes('PhpFunctionResolutionSourceInventoryAuthorityInterface') && authority.includes('PhpFunctionResolutionSourceInventoryInput')],
  ['implementation uses the canonical upstream inventory contract', authority.includes('PHP_FUNCTION_RESOLUTION_SOURCE_INVENTORY_CONTRACT')],
  ['source-file identity is checked against region and coverage evidence', authority.includes('sameFile(coverage.sourceFile, input.sourceFile)') && authority.includes('sameFile(region.sourceFile, sourceFile)')],
  ['whole-file coverage span must exactly match input source span', authority.includes('sameSpan(coverage.source, input.source)')],
  ['invalid and out-of-file source spans are rejected', authority.includes('validSpan') && authority.includes('spanWithin(region.source, source)')],
  ['region completeness witness must identify the exact region', authority.includes('sameSpan(completeness.source, region.source)') && authority.includes('sameRegion(completeness.region, region)')],
  ['all four region completeness obligations are required', authority.includes("completeness.obligations[3] === 'function-declarations-inventoried'")],
  ['namespace imports are bound to the exact region', authority.includes('namespaceImports.items.map(binding => ({ source: binding.source, region: binding.region')],
  ['function imports are bound to the exact region', authority.includes('functionImports.items.map(binding => ({ source: binding.source, region: binding.region')],
  ['declared functions are bound to the exact region', authority.includes('declarations.items.map(declaration => ({ source: declaration.source, region: declaration.region')],
  ['duplicate region identities are rejected', authority.includes('sameRegion(left.region, right.region)')],
  ['overlapping namespace region spans are rejected', authority.includes('left.region.source.start.value < right.region.source.end.value')],
  ['empty region list cannot be certified complete', authority.includes('if (input.regions.length === 0) missing.add')],
  ['incomplete evidence returns a typed incomplete inventory judgment', authority.includes("kind: 'php_function_resolution_source_inventory_incomplete'")],
  ['complete inventory publishes only after all validation obligations pass', authority.indexOf('if (missingEvidence.length > 0)') < authority.indexOf("kind: 'php_function_resolution_source_inventory_complete'")],
  ['authority implementation is exported through upstream index', upstreamIndex.includes("export { phpFunctionResolutionSourceInventoryAuthority } from './phpFunctionResolutionSourceInventoryAuthority'")],
  ['no semantic foundation or relations dependency was introduced', !authority.includes('semantic/foundation') && !authority.includes('semantic/relations')],
  ['invocation integration blockers remain explicit until real scanner evidence exists', invocation.includes('source-wide-namespace-inventory-authority-not-connected-to-name-resolution') && binding.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING')],
  ['existing integrated response retains its PHP invocation slot', pipeline.includes('phpFunctionInvocations: PhpFunctionInvocationSemanticIntegrationState')],
  ['scanner consumes injected integration state without selecting pending itself', scanner.includes('phpFunctionInvocations });') && !scanner.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING')],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
