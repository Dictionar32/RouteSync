const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['frontend contract version advanced', read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts').includes('readonly version: 7;')],
  ['parser rejection is a closed coverage ADT arm', read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts').includes("readonly kind: 'php_source_frontend_parse_blocked'")],
  ['parser rejection carries a typed failure discriminator', read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts').includes("readonly kind: 'php_source_frontend_parser_rejected_source'")],
  ['parser failure diagnostic is a closed ADT', read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts').includes('PhpSourceFrontendParserFailureDiagnostic') && read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts').includes('php_source_frontend_parser_error_diagnostic')],
  ['adapter preserves parser message and reliable line/column evidence', read('packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts').includes('error.message') && read('packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts').includes("Reflect.get(error, 'lineNumber')") && read('packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts').includes("Reflect.get(error, 'columnNumber')")],
  ['parse catch emits the blocked arm', read('packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts').includes("kind: 'php_source_frontend_parse_blocked'")],
  ['validation authority explicitly recognizes parser rejection', read('packages/core/src/types/upstream/phpSourceFrontendExtractionValidationAuthority.ts').includes("parser-blocked-coverage-with-complete-evidence-claims")],
  ['pipeline gates semantic work on validated completeness', read('packages/core/src/types/upstream/phpSourceInvocationSemanticPipelineAuthority.ts').includes("if (validation.completeness !== 'complete') return blocked(incompleteCoverage(document, validation));")],
  ['no forbidden foundation or relations imports introduced', !/semantic\/(foundation|relations)/.test(['packages/core/src/types/upstream/phpSourceFrontendInterface.ts','packages/core/src/types/upstream/phpSourceFrontendExtractionValidationAuthority.ts','packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts'].map(read).join('\n'))],
];
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
else process.stdout.write(`RESULT ${checks.length}/${checks.length} passed\n`);
