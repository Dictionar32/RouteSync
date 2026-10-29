const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const algebra = read('packages/core/src/types/upstream/astClassifierRuleAlgebra.ts');
const contract = read('packages/core/src/types/upstream/astClassifierEvidenceContract.ts');
const checks = [
  ['upstream algebra owns ordered candidate resolution', algebra.includes('resolveFirst') && algebra.includes('resolveAt')],
  ['upstream algebra owns first-applicable rule selection', /const rule = rules\[index\]/.test(algebra) && /rule\.applies\(input\)/.test(algebra) && /rule\.resolve\(input\)/.test(algebra) && /resolveAt\(rules, input, index \+ 1/.test(algebra)],
  ['PHP parser supplies typed expression and statement rule catalogs to upstream algebra', runtime.includes('AstClassificationRule<AstClassificationInput, PhpAstValueNode') && runtime.includes('astClassificationRuleAlgebra.resolveFirst(AST_CLASSIFICATION_RULES, input)') && runtime.includes('resolveFirst(structuredStatementRules')],
  ['runtime no longer performs candidate dispatch itself', !/const candidates = relationProject\(astClassificationRules/.test(runtime) && !/const candidate = relationFirst\(candidates/.test(runtime)],
  ['algebra is language-agnostic', !/PhpAst|TokenDescriptor|PHP_SYNTAX/.test(algebra)],
  ['closed syntax request/result contract remains in place', contract.includes('AstClassifierEvidenceRequest') && contract.includes('AstClassifierEvidenceResult')],
  ['semantic judgment production remains outside scanner parser', !runtime.includes('createScannerEvidencePort') && read('packages/core/src/types/upstream/astSemanticEvidenceProducer.ts').includes('createScannerEvidencePort')],
  ['build command preserved', /"build"\s*:\s*"tsdown"/.test(read('package.json'))],
];
const result = { phase: 1415, status: checks.every(([, ok]) => ok) ? 'passed' : 'failed', passed: checks.filter(([, ok]) => ok).length, total: checks.length, checks: checks.map(([name, ok]) => ({ name, status: ok ? 'passed' : 'failed' })), residuals: ['PHP grammar-specific expression rule definitions remain in astClassifierRuntime by design; next migration boundary is statement/assignment grammar into rule contracts.', 'Full TypeScript build requires installed workspace dependencies.'] };
const report = path.join(root, 'scripts/audits/reports/phase1415-ast-classifier-algebra.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
for (const check of result.checks) process.stdout.write(`${check.status === 'passed' ? 'PASS' : 'FAIL'} ${check.name}\n`);
process.stdout.write(`PHASE1415 ${result.status}: ${result.passed}/${result.total}\n`);
if (result.status !== 'passed') process.exitCode = 1;
