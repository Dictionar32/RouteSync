const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const frontend = read('packages/core/src/types/upstream/phpSourceFrontendInterface.ts');
const batchContract = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const batchAuthority = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticJudgmentBatchClosureAuthority.ts');
const scanner = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const checks = [
  ['source frontend is an explicit upstream interface', /interface PhpSourceFrontendInterface/.test(frontend)],
  ['frontend accepts a typed PHP source document', /interface PhpSourceDocument/.test(frontend) && /readonly content: PhpSourceText/.test(frontend)],
  ['callee syntax remains segmented source evidence', /readonly syntax: PhpFunctionNameSyntaxEvidence/.test(frontend)],
  ['call arguments remain typed semantic evidence', /readonly arguments: ExpressionArguments/.test(frontend)],
  ['whole-file extraction binds namespace inventory and invocations', /readonly nameResolutionInventory: PhpFunctionResolutionSourceInventoryInput/.test(frontend) && /readonly invocations: readonly PhpFunctionInvocationSourceSyntaxEvidence\[\]/.test(frontend)],
  ['frontend coverage is a complete/incomplete discriminated union', /php_source_frontend_coverage_complete/.test(frontend) && /php_source_frontend_coverage_incomplete/.test(frontend)],
  ['frontend contract forbids semantic name resolution', /never-resolve-names-or-create-invocation-judgments-in-the-frontend/.test(frontend)],
  ['frontend contract explicitly rejects method-body-only completeness', /whole-file-namespace-import-declaration-and-invocation-inventory-not-method-body-only/.test(frontend)],
  ['new interface is exported from upstream index', /export \* from '\.\/phpSourceFrontendInterface'/.test(upstreamIndex)],
  ['batch contract requires certified whole-file span containment', /require-every-invocation-and-callee-span-to-fit-certified-whole-file-span/.test(batchContract)],
  ['batch contract names the source-span binding invariant', /wholeFileSpanBinding/.test(batchContract)],
  ['batch closure rejects invocation evidence outside certified source', /invocation-outside-certified-source-span/.test(batchContract) && /spanWithin\(evidenceSource\(evidence\), witness\.source\)/.test(batchAuthority)],
  ['callee syntax span is also constrained to certified source', /syntaxSources\(evidence\)\.some\(source => !spanWithin\(source, witness\.source\)\)/.test(batchAuthority)],
  ['Laravel scanner still uses upstream integration state rather than reclassifying', /PhpFunctionInvocationSemanticIntegrationState/.test(scanner) && /invocationSemanticIntegratedResponseComposition\.integrate/.test(scanner)],
  ['no semantic foundation or relations dependency added to frontend contract', !/semantic\/(foundation|relations)/.test(frontend)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`Phase 1798: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
