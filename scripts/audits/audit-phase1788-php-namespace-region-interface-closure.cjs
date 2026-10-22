const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const iface = read('packages/core/src/types/upstream/phpFunctionNameResolutionInterface.ts');
const authority = read('packages/core/src/types/upstream/phpFunctionNameResolutionAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const scannerBinding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const pipeline = read('packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts');
const checks = [
  ['namespace region has explicit global and named variants', iface.includes("kind: 'global_php_namespace_region'") && iface.includes("kind: 'named_php_namespace_region'")],
  ['function scopes own a lexical region identity', iface.includes("readonly region: Extract<PhpNamespaceRegionIdentity, { readonly kind: 'global_php_namespace_region' }>") && iface.includes("readonly region: Extract<PhpNamespaceRegionIdentity, { readonly kind: 'named_php_namespace_region' }>")],
  ['namespace/function imports and declarations bind to a region', (iface.match(/readonly region: PhpNamespaceRegionIdentity/g) ?? []).length >= 3],
  ['completeness witness binds the exact region', iface.includes('readonly region: PhpNamespaceRegionIdentity') && iface.includes('completeness-witness-must-identify-the-exact-lexical-namespace-region-and-source-file')],
  ['contract declares lexical-region obligations', iface.includes("'require-name-and-environment-belong-to-the-same-namespace-region'") && iface.includes("'require-imports-and-declarations-belong-to-the-same-namespace-region'")],
  ['resolution authority checks source spans against region bounds', authority.includes('spanWithin(input.source, region.source)') && authority.includes('segmentSources.every(source => spanWithin(source, region.source))')],
  ['resolution authority checks every import/declaration region', authority.includes('evidence.every(item => sameRegion(item.region, region) && spanWithin(item.source, region.source))')],
  ['namespace-region witness is compared to scope region', authority.includes('sameRegion(witness.region, region)') && authority.includes('sameSpan(witness.source, region.source)')],
  ['builtin classification still follows canonical target resolution', authority.includes('builtinTarget(targetName, evidence) ?? externalTarget(targetName, evidence, basis)')],
  ['name-resolution authority has no semantic relations/foundation dependency', !authority.includes('semantic/relations') && !authority.includes('semantic/foundation')],
  ['Laravel scanner receives the upstream-typed PHP integration state', scanner.includes('PhpFunctionInvocationSemanticIntegrationState') && scanner.includes('phpFunctionInvocations });')],
  ['production composition root owns the explicit pending state', scannerBinding.includes('PHP_FUNCTION_INVOCATION_SEMANTIC_INTEGRATION_PENDING') && scannerBinding.includes('createControllerDataflowAnalyzer(')],
  ['integrated response retains the existing PHP invocation integration slot', pipeline.includes('phpFunctionInvocations')],
];
const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
