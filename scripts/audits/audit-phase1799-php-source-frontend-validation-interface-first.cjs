const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/phpSourceFrontendValidationAuthorityInterface.ts');
const authority = read('packages/core/src/types/upstream/phpSourceFrontendExtractionValidationAuthority.ts');
const frontend = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const batch = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const scanner = read('packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['validation is an explicit upstream authority interface', /interface PhpSourceFrontendExtractionValidationAuthorityInterface/.test(contract)],
  ['validation receives both source document and extraction', /readonly document: PhpSourceDocument/.test(contract) && /readonly extraction: PhpSourceFrontendExtraction/.test(contract)],
  ['validation publishes a closed validated-or-rejected result', /php_source_frontend_extraction_validated/.test(contract) && /php_source_frontend_extraction_rejected/.test(contract)],
  ['rejected result requires a non-empty violation tuple', /readonly \[PhpSourceFrontendExtractionViolation, \.\.\.PhpSourceFrontendExtractionViolation\[\]\]/.test(contract)],
  ['document and extraction file identity is validated', /document-source-file-mismatch/.test(authority) && /input\.document\.sourceFile/.test(authority)],
  ['whole-file source span is validated', /invalid-whole-file-span/.test(authority) && /validSpan\(source\)/.test(authority)],
  ['inventory shares exact file and whole-file span', /inventory-source-mismatch/.test(authority) && /sameSpan\(extraction\.nameResolutionInventory\.source, source\)/.test(authority)],
  ['invocation source spans are constrained to the file', /invocation-outside-whole-file-span/.test(authority) && /within\(invocation\.source, source\)/.test(authority)],
  ['callee syntax segments are constrained to the file', /callee-syntax-outside-whole-file-span/.test(authority) && /syntaxSpans\(invocation\.syntax\)/.test(authority)],
  ['complete parser coverage cannot mask incomplete namespace inventory', /complete-coverage-with-incomplete-inventory/.test(authority)],
  ['incomplete extraction stays incomplete rather than promoted', /completeness: extraction\.coverage\.kind === 'php_source_frontend_coverage_complete'/.test(authority) && /'incomplete'/.test(authority)],
  ['frontend remains syntax-only and does not resolve names', /never-resolve-names-or-create-invocation-judgments-in-the-frontend/.test(frontend)],
  ['batch closure remains the downstream consumer boundary', /PhpFunctionInvocationSemanticJudgmentBatch/.test(batch) && /reject-closure-when-any-obligation-fails/.test(batch)],
  ['Laravel scanner does not acquire new source-classification logic', /invocationSemanticIntegratedResponseComposition\.integrate/.test(scanner) && !/phpSourceFrontendExtractionValidationAuthority/.test(scanner)],
  ['new interface and authority are exported upstream', /export \* from '\.\/phpSourceFrontendValidationAuthorityInterface'/.test(index) && /phpSourceFrontendExtractionValidationAuthority/.test(index)],
  ['new implementation avoids semantic foundation and relations dependencies', !/semantic\/(foundation|relations)/.test(authority) && !/semantic\/(foundation|relations)/.test(contract)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`Phase 1799: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
