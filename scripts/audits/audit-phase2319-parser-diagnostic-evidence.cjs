const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const contract = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const adapter = read('packages/cli/src/parsers/php/sourceFrontendAstAdapter.ts');
const checks = [
  ['frontend contract version advanced to 7', contract.includes('readonly version: 7;') && contract.includes('version: 7,')],
  ['parser diagnostic is a closed discriminated union', contract.includes('PhpSourceFrontendParserFailureDiagnostic') && contract.includes("kind: 'php_source_frontend_parser_error_diagnostic'") && contract.includes("kind: 'php_source_frontend_parser_failure_diagnostic_unavailable'")],
  ['source location availability is represented explicitly', contract.includes("kind: 'php_source_frontend_parser_location_available'") && contract.includes("kind: 'php_source_frontend_parser_location_unavailable'")],
  ['failure ADT carries diagnostic evidence', contract.includes("kind: 'php_source_frontend_parser_rejected_source'; readonly diagnostic: PhpSourceFrontendParserFailureDiagnostic")],
  ['adapter preserves parser error message', adapter.includes('stringValue(error.message)')],
  ['adapter preserves reliable one-based line and column when present', adapter.includes("Reflect.get(error, 'lineNumber')") && adapter.includes("Reflect.get(error, 'columnNumber')") && adapter.includes('line > 0') && adapter.includes('column > 0')],
  ['non-Error throws remain a typed diagnostic-unavailable arm', adapter.includes("kind: 'php_source_frontend_parser_failure_diagnostic_unavailable'")],
  ['parser rejection remains blocked instead of producing an AST', adapter.includes('catch (error: unknown)') && adapter.includes('incompleteExtraction(document, parserFailureDiagnostic(error))')],
  ['no foundation or relations imports introduced', !/semantic\/(foundation|relations)/.test(contract + adapter)],
];
for (const [name, ok] of checks) process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
else process.stdout.write(`RESULT ${checks.length}/${checks.length} passed\n`);
