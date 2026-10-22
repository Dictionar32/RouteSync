const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const contract = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticAuthorityInterface.ts');
const authority = read('packages/core/src/types/upstream/phpFunctionInvocationSemanticJudgmentBatchClosureAuthority.ts');
const exportIndex = read('packages/core/src/types/upstream/index.ts');
const report = read('scripts/audits/phase1797-php-invocation-batch-authority-report.md');
const checks = [
  ['existing batch contract evolved to version 5', /PhpFunctionInvocationSemanticJudgmentBatchContract[\s\S]*?readonly version: 5/.test(contract)],
  ['batch derivation input is a named typed contract', /interface PhpFunctionInvocationSemanticJudgmentBatchDerivationInput/.test(contract)],
  ['batch authority interface exposes derive operation', /readonly derive: \([\s\S]*?PhpFunctionInvocationSemanticJudgmentBatchDerivationInput/.test(contract)],
  ['batch contract requires one resolution per inventory entry', /require-one-name-resolution-judgment-per-inventory-entry/.test(contract)],
  ['batch contract rejects resolutions outside inventory', /reject-name-resolution-judgments-outside-source-inventory/.test(contract)],
  ['orphan resolution is a closed typed violation', /name-resolution-judgment-outside-inventory/.test(contract)],
  ['batch derivation matches resolution by original input identity', /resolution\.source === evidence\.resolutionInput/.test(authority)],
  ['batch derives invocation judgment through existing authority', /phpFunctionInvocationSemanticAuthority\.derive/.test(authority)],
  ['batch derivation invokes existing closure authority operation', /const closure = close\(/.test(authority)],
  ['missing resolution remains rejected through total correspondence', /missing-invocation-judgment/.test(authority)],
  ['duplicate resolution remains rejected through duplicate evidence detection', /duplicate-invocation-evidence/.test(authority)],
  ['orphan resolutions are included in rejection ledger', /orphanViolations/.test(authority) && /name-resolution-judgment-outside-inventory/.test(authority)],
  ['validated receipt remains the only validated batch representation', /php_function_invocation_semantic_judgment_batch_validated/.test(contract)],
  ['existing upstream index exports authority interface', /export \* from '\.\/phpFunctionInvocationSemanticAuthorityInterface'/.test(exportIndex)],
  ['existing upstream index exports the batch authority implementation', /phpFunctionInvocationSemanticJudgmentBatchClosureAuthority/.test(exportIndex)],
  ['no new semantic foundation or relations dependency', !/semantic\/(foundation|relations)/.test(authority)],
  ['scanner integration pending remains truthful', /whole-file-namespace-region-inventory-not-available-to-method-body-scanner/.test(contract)],
  ['report records limits and next integration step', /does not claim the scanner is already wired|belum terhubung|belum dijalankan/i.test(report)],
];
let failed = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed += Number(!passed);
}
process.stdout.write(`Phase 1797: ${checks.length - failed}/${checks.length} passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
