// Phase 1737's second authority was intentionally superseded in Phase 1738 after
// tracing found overlapping correspondence ownership with publication authority.
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const pipeline = fs.readFileSync(path.join(root, 'packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts'), 'utf8');
const index = fs.readFileSync(path.join(root, 'packages/core/src/index.ts'), 'utf8');
const checks = [];
const check = (name, passed) => checks.push({ name, passed: Boolean(passed) });
check('superseded integrated-response authority interface is removed', !pipeline.includes('InvocationSemanticIntegratedResponseAuthorityInterface'));
check('superseded integrated-response authority boundary is removed', !pipeline.includes('InvocationSemanticIntegratedResponseAuthorityBoundaryContract'));
check('superseded authority input and violation layer are removed', !pipeline.includes('InvocationSemanticIntegratedResponseAuthorityInput') && !pipeline.includes('InvocationSemanticIntegratedResponseViolation'));
check('integrated response contract remains as a projection of publication receipt', pipeline.includes('InvocationSemanticIntegratedResponseContract') && pipeline.includes('publication-authority-is-the-single-owner-of-inventory-analysis-publication-correspondence-validation'));
check('public exports no longer expose superseded authority symbols', !index.includes('InvocationSemanticIntegratedResponseAuthorityInterface') && !index.includes('InvocationSemanticIntegratedResponseAuthorityBoundaryContract'));
check('Phase 1738 single-authority audit is registered', JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts['audit:phase1738-publication-receipt-single-authority'] === 'node scripts/audits/audit-phase1738-publication-receipt-single-authority.cjs');
const failed = checks.filter(item => !item.passed);
for (const item of checks) process.stdout.write(`${item.passed ? 'PASS' : 'FAIL'} ${item.name}\n`);
process.stdout.write(`\n${checks.length - failed.length}/${checks.length} superseded-authority checks passed.\n`);
fs.writeFileSync(path.join(root, 'PHASE1737_AUDIT.json'), JSON.stringify({ phase: 1737, name: 'superseded-integrated-response-authority-model', total: checks.length, passed: checks.length - failed.length, failed: failed.length, checks }, null, 2) + '\n');
if (failed.length) process.exit(1);
