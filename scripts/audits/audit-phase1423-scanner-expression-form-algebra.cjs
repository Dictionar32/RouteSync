const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const algebra = read('packages/core/src/types/upstream/scannerExpressionFormAlgebra.ts');
const runtime = read('packages/core/src/compiler/scanner/lexer/astClassifierRuntime.ts');
const projector = read('packages/core/src/compiler/scanner/lexer/phpExpressionStructureProjector.ts');
const testPath = 'packages/core/src/types/upstream/__test__/scannerExpressionFormAlgebra.phase1423.test.ts';
const test = read(testPath);
const pkg = JSON.parse(read('package.json'));
const ternaryStart = runtime.indexOf('function classifyTernary(');
const ternaryEnd = runtime.indexOf('\nfunction classifyCompoundExpression(', ternaryStart);
const ternary = runtime.slice(ternaryStart, ternaryEnd);
const compoundStart = runtime.indexOf('function classifyCompoundExpression(');
const compoundEnd = runtime.indexOf('\nfunction classifyInstanceOf(', compoundStart);
const compound = runtime.slice(compoundStart, compoundEnd);
const checks = [
  ['algebra exposes generic prefix and conditional contracts', /PrefixExpressionContract<Token, Operator>/.test(algebra) && /ConditionalExpressionContract<Token>/.test(algebra)],
  ['conditional matching and nested ternary pairing belong to algebra', /nestedQuestions/.test(algebra) && /resolveConditional/.test(algebra)],
  ['prefix resolution validates rules and missing operands', /duplicate_operator_token/.test(algebra) && /missing_operand/.test(algebra)],
  ['runtime delegates ternary structure to the algebra', /scannerExpressionFormAlgebra\.resolveConditional/.test(ternary) && /findTopLevelCandidates/.test(ternary)],
  ['runtime no longer locally pairs ternary question and colon markers', !/findTopLevelOperator\(tokens, '\?'\)/.test(ternary) && !/findTopLevelOperator\(relationSlice\(tokens/.test(ternary)],
  ['runtime delegates unary prefix selection to the algebra', /scannerExpressionFormAlgebra\.resolvePrefix/.test(compound)],
  ['runtime retains PHP-specific operator facts while AST construction is delegated to the projector', /kind: 'not'/.test(compound) && /projectPhpExpressionStructure/.test(compound) && /PhpAstFactory\.unaryExpression/.test(projector) && /PhpAstFactory\.ternaryExpression/.test(projector)],
  ['tests cover nested ternary, missing colon, prefix and missing operand', /nested ternaries/.test(test) && /missing its colon/.test(test) && /no operand/.test(test)],
  ['new algebra introduces no any', !/\bany\b/.test(algebra)],
  ['phase audit is registered and build script remains unchanged', pkg.scripts['audit:phase1423-scanner-expression-form-algebra'] === 'node scripts/audits/audit-phase1423-scanner-expression-form-algebra.cjs' && pkg.scripts.build === 'tsdown'],
];
const result = { phase: 1423, title: 'scanner-expression-form-algebra', checks: checks.map(([name, passed]) => ({ name, passed })), passed: checks.filter(([, passed]) => passed).length, total: checks.length, status: checks.every(([, passed]) => passed) ? 'passed_with_build_pending' : 'failed' };
const report = path.join(root, 'scripts/audits/reports/phase1423-scanner-expression-form-algebra.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
if (result.status === 'failed') process.exitCode = 1;
