const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const frontend = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const validationInterface = read('packages/core/src/types/upstream/phpSourceFrontendValidationAuthorityInterface.ts');
const validationAuthority = read('packages/core/src/types/upstream/phpSourceFrontendExtractionValidationAuthority.ts');
const pipelineAuthority = read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts');
const tokenizer = read('packages/core/src/compiler/frontend/php/tokenizer.ts');
const methodParser = read('packages/core/src/compiler/frontend/php/phpMethodParser.ts');
const analyzer = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const scannerBinding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');

const checks = [
  ['frontend-contract-version-evolved-with-independent-inventory-closure', frontend.includes("readonly version: 5;") && frontend.includes("version: 5,")],
  ['extraction-requires-explicit-traversal-witness', frontend.includes('readonly traversal: PhpSourceFrontendTraversalEvidence;')],
  ['traversal-evidence-distinguishes-whole-file-ast', frontend.includes("kind: 'php_source_whole_file_ast_traversal'")],
  ['traversal-evidence-distinguishes-partial-token-or-method-body', frontend.includes("kind: 'php_source_partial_token_or_method_body_traversal'")],
  ['whole-file-traversal-covers-namespace-import-declarations', frontend.includes("'namespace-region-declarations'") && frontend.includes("'function-import-declarations'") && frontend.includes("'named-function-declarations'")],
  ['whole-file-traversal-covers-invocations-and-arguments', frontend.includes("'function-invocation-nodes'") && frontend.includes("'invocation-argument-lists'")],
  ['validator-binds-traversal-to-source-file-and-span', validationAuthority.includes('traversal-source-file-mismatch') && validationAuthority.includes('traversal-source-mismatch')],
  ['validator-rejects-complete-coverage-with-partial-traversal', validationAuthority.includes('complete-coverage-with-partial-parser-traversal')],
  ['validator-checks-traversal-obligations-and-unvisited-families', validationAuthority.includes('complete-traversal-obligations-incomplete') && validationAuthority.includes('complete-traversal-with-unvisited-syntax-families')],
  ['validation-contract-version-evolved-with-independent-inventory-closure', validationInterface.includes('readonly version: 6;') && validationInterface.includes('version: 6,')],
  ['pipeline-consumes-only-validated-complete-frontend', pipelineAuthority.includes('if (validation.completeness !== \'complete\')')],
  ['pipeline-syntax-inventory-binding-is-unambiguous', pipelineAuthority.includes('const invocationSyntaxInventory = extraction.invocationInventory;') && !pipelineAuthority.includes('const invocationInventory = extraction.invocationInventory;')],
  ['active-tokenizer-is-lexical-not-whole-file-ast', tokenizer.includes('export function tokenizePhpSource') && !tokenizer.includes('namespace-region-declarations')],
  ['method-parser-scope-is-method-oriented', methodParser.includes('parsePhpMethod')],
  ['laravel-scanner-pipeline-seam-lives-at-the-wiring-composition-root', scannerBinding.includes('phpSourceInvocationSemanticPipelineIntegrationAuthority.project(phpSourceInvocationPipelineEvidenceFromSourceBinding(sourceBinding))') && analyzer.includes('integratedResponse: InvocationPhpSourceIntegratedResponse') && analyzer.includes('phpSourceInvocationPipeline: integratedResponse') && !analyzer.includes('createControllerDataflowAnalyzerFromPhpSourcePipeline')],
  ['no-parser-implementation-falsely-claimed', !frontend.includes('const phpSourceFrontend: PhpSourceFrontendInterface')],
];

for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const passed = checks.filter(([, result]) => result).length;
process.stdout.write(`SUMMARY ${passed}/${checks.length} checks passed\n`);
process.exitCode = passed === checks.length ? 0 : 1;
