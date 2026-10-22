const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const frontend = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const adapter = read('packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts');
const validation = read('packages/core/src/types/upstream/phpSourceFrontendValidationAuthorityInterface.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const checks = [
  ['frontend-contract-version-5', frontend.includes('readonly version: 5;') && frontend.includes('version: 5,')],
  ['unsupported-call-shapes-are-explicit-contract-obligation', frontend.includes('unsupportedInvocationHandling') && frontend.includes('unsupported-callee-shapes-must-never-be-silently-dropped')],
  ['unrepresentable-call-node-blocks-inventory-completeness', adapter.includes("if (callee === undefined || nodeKind(callee) !== 'name') {\n        invocationMappingComplete = false;")],
  ['source-span-and-argument-evidence-still-gate-completeness', adapter.includes('if (invocationSource === undefined || syntax === undefined) { invocationMappingComplete = false; return []; }') && adapter.includes('if (argumentsEvidence === undefined) { invocationMappingComplete = false; return []; }')],
  ['upstream-validation-still-rejects-incomplete-coverage', validation.includes('never-promote-incomplete-coverage-to-complete-validation')],
  ['scanner-does-not-fabricate-connected-source-result', scanner.includes("kind: 'php_source_invocation_pipeline_not_connected'") && scanner.includes('analyzeControllerDataflowFromPhpSourcePipeline')],
  ['no-semantic-foundation-dependency-added', !adapter.includes('semantic/foundation') && !frontend.includes('semantic/foundation')],
];
for (const [name, passed] of checks) process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
const failed = checks.filter(([, passed]) => !passed).length;
process.stdout.write(`SUMMARY ${checks.length - failed}/${checks.length} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
