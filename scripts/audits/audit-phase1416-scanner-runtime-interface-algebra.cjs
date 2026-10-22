const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const algebra = read('packages/core/src/types/upstream/astClassifierRuleAlgebra.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const evidence = read('packages/core/src/compiler/scanner/lexer/astClassifierEvidence.ts');
const pkg = JSON.parse(read('package.json'));
const trace = read('docs/PHASE1416_SCANNER_RUNTIME_INTERFACE_ALGEBRA_TRACE.md');
const checks = [
  ['algebra owns applicability contract', /AstRuleApplicability/.test(algebra) && /applies:/.test(algebra)],
  ['algebra short-circuits ordered rules', /resolveAt/.test(algebra) && /const rule = rules\[index\]/.test(algebra) && /rule\.resolve\(input\)/.test(algebra)],
  ['expression catalog uses contract', /expressionRule\(/.test(runtime) && /astClassificationRuleAlgebra\.resolveFirst\(AST_CLASSIFICATION_RULES/.test(runtime)],
  ['structured statements use declarative rule catalog', /structuredStatementRules/.test(runtime) && /resolveFirst\(structuredStatementRules/.test(runtime)],
  ['simple statements use declarative rule catalog', /simpleStatementRules/.test(runtime) && /resolveFirst\(simpleStatementRules/.test(runtime)],
  ['structured/simple statement selection no longer uses candidate solver', !/function parseStructuredStatement[\s\S]*?solveOptionalCandidate/.test(runtime) && !/function parseSimpleStatement[\s\S]*?solveOptionalCandidate/.test(runtime)],
  ['evidence adapter remains typed and isolated', /AstClassifierEvidenceInterface/.test(evidence) && /runtimeClassifyAstTokens/.test(evidence)],
  ['scanner-wide trace records next migration surfaces', /parseStatements/.test(trace) && /queryEvidenceProducer/.test(trace) && /validationRuleEntry/.test(trace)],
  ['build script preserved', pkg.scripts.build === 'tsdown'],
];
const failed = checks.filter(([, ok]) => !ok);
console.log(JSON.stringify({ phase: 1416, status: failed.length ? 'failed' : 'passed_with_residuals', passed: checks.length - failed.length, total: checks.length, checks: checks.map(([name, ok]) => ({ name, ok })), residuals: ['parseStatements still owns recursive sequence traversal', 'PHP grammar productions remain in runtime by design', 'TypeScript build not run unless tsdown dependencies are installed'] }, null, 2));
if (failed.length) process.exitCode = 1;
