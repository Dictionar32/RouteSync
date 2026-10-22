const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const adapter = read('packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts');
const frontend = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const validator = read('packages/core/src/types/upstream/phpSourceFrontendExtractionValidationAuthority.ts');
const validationInterface = read('packages/core/src/types/upstream/phpSourceFrontendValidationAuthorityInterface.ts');
const checks = [
  ['frontend contract v4 separates inventory closure obligations', frontend.includes('readonly version: 4;') && frontend.includes('derive-name-resolution-inventory-completeness-only-from-region-import-declaration-evidence') && frontend.includes('derive-invocation-inventory-completeness-only-from-invocation-callee-argument-evidence') && frontend.includes('require-both-closed-inventories-before-aggregate-complete-coverage')],
  ['validation contract v6 binds independent inventory closure', validationInterface.includes('readonly version: 6;') && validationInterface.includes('validate-independent-inventory-closure-before-aggregate-completeness')],
  ['frontend adapter implements the existing upstream interface', adapter.includes('phpSourceFrontendAstAdapter: PhpSourceFrontendInterface')],
  ['whole-file parse remains the evidence source', adapter.includes('parser.parseCode(sourceText, file.value.value)')],
  ['source inventory completeness has its own state', adapter.includes('let sourceInventoryMappingComplete = true;')],
  ['invocation inventory completeness has its own state', adapter.includes('let invocationMappingComplete = true;')],
  ['the shared ambiguous completeness flag is removed', !adapter.includes('inventoryMappingComplete')],
  ['completeness states are declared before namespace traversal can mutate them', adapter.indexOf('let sourceInventoryMappingComplete = true;') < adapter.indexOf('if (declaredNamespace === undefined && !bracketedGlobalNamespace) sourceInventoryMappingComplete = false;')],
  ['namespace nodes missing source spans downgrade source inventory', adapter.includes('if (namespaceNodes.length !== allNamespaceNodes.length) sourceInventoryMappingComplete = false;')],
  ['namespace declaration failures affect only source inventory completeness', adapter.includes('if (declaredNamespace === undefined && !bracketedGlobalNamespace) sourceInventoryMappingComplete = false;')],
  ['import mapping failures affect source inventory completeness', adapter.includes('if (target === undefined || kind === undefined) { sourceInventoryMappingComplete = false; return; }')],
  ['function declaration mapping failures affect source inventory completeness', adapter.includes('if (region === undefined || nodeSource === undefined || name === undefined) { sourceInventoryMappingComplete = false; return; }')],
  ['source inventory closure uses its own evidence state', adapter.includes('coverage: sourceInventoryMappingComplete\n')],
  ['callee or invocation span failures affect invocation completeness', adapter.includes('if (invocationSource === undefined || syntax === undefined) { invocationMappingComplete = false; return []; }')],
  ['argument mapping failures affect invocation completeness', adapter.includes('if (argumentsEvidence === undefined) { invocationMappingComplete = false; return []; }')],
  ['invocation inventory closure uses its own evidence state', adapter.includes('const invocationInventory: PhpSourceInvocationSyntaxInventory = invocationMappingComplete')],
  ['aggregate frontend completeness requires both inventories', adapter.includes('coverage: sourceInventoryMappingComplete && invocationMappingComplete')],
  ['aggregate incomplete evidence names the missing inventory domain', adapter.includes("!sourceInventoryMappingComplete ? ['namespace-region-declarations', 'function-import-declarations']") && adapter.includes("!invocationMappingComplete ? ['function-invocation-nodes', 'invocation-argument-lists']")],
  ['validator rejects complete aggregate coverage with incomplete source inventory', validator.includes("kind: 'complete-coverage-with-incomplete-inventory'")],
  ['validator rejects complete aggregate coverage with incomplete invocation inventory', validator.includes("kind: 'complete-coverage-with-incomplete-invocation-inventory'")],
  ['contract still forbids semantic resolution inside the frontend', frontend.includes('never-resolve-names-or-create-invocation-judgments-in-the-frontend')],
  ['adapter still reports parser failure as incomplete evidence', adapter.includes('catch {') && adapter.includes('return incompleteExtraction(document)')],
  ['adapter does not import semantic foundation', !adapter.includes('semantic/foundation')],
  ['adapter does not import semantic relations', !adapter.includes('semantic/relations')],
];
let failures = 0;
for (const [label, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${label}\n`);
  if (!passed) failures += 1;
}
process.stdout.write(`\nPhase 1810 audit: ${checks.length - failures}/${checks.length} passed\n`);
process.exitCode = failures === 0 ? 0 : 1;
