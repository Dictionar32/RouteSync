const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const expressionModel = read('packages/core/src/types/upstream/expression.ts');
const astModel = read('packages/core/src/types/upstream/ast.ts');
const producer = read('packages/core/src/compiler/scanner/operations/expressionProducer.ts');
const structure = read('packages/core/src/types/upstream/scannerExpressionStructure.ts');
const runtime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const projector = read('packages/core/src/compiler/frontend/php/phpExpressionStructureProjector.ts');
const index = read('packages/core/src/types/upstream/index.ts');
const tests = read('packages/core/src/compiler/scanner/__test__/upstream-contracts/scannerExpressionStructure.phase1428.test.ts');
const compoundStart = runtime.indexOf('function classifyCompoundExpression(');
const compoundEnd = runtime.indexOf('\nfunction classifyInstanceOf(', compoundStart);
const compound = runtime.slice(compoundStart, compoundEnd);
const checks = [
  ['upstream Expression ADT already models semantic expression forms', /export type Expression\s*=/.test(expressionModel) && /kind: 'binary'/.test(expressionModel) && /kind: 'conditional'/.test(expressionModel) && /kind: 'coalesce'/.test(expressionModel)],
  ['upstream ExpressionAst is the canonical AST judgment', /export type ExpressionAst = Extract<AstJudgment, \{ readonly kind: 'expression_ast' \}>/.test(astModel)],
  ['existing expression producer already projects PHP AST into upstream Expression', /expressionFromPhpAst/.test(producer) && /phpAstExpressionSemanticAuthority/.test(producer) && /expressionAstFromPhpAst/.test(producer)],
  ['scanner-specific ExpressionStructure remains the correct pre-AST structural model', /export type \{[\s\S]*ExpressionStructure/.test(structure) && /ExpressionStructure/.test(read('packages/core/src/types/upstream/scannerExpressionJudgmentInterface.ts')) && /kind: 'array_access'/.test(read('packages/core/src/types/upstream/scannerExpressionJudgmentInterface.ts')) && /kind: 'binary'/.test(read('packages/core/src/types/upstream/scannerExpressionJudgmentInterface.ts'))],
  ['runtime resolves a structure before delegating projection', /providePhpExpressionStructureJudgment/.test(runtime) && /projectPhpExpressionStructure/.test(runtime)],
  ['runtime no longer owns the compound structure-to-AST switch', !/case 'short_ternary': return relationSome\(locateAstValue\(PhpAstFactory/.test(compound) && !/case 'binary':\s*\{\s*const left/.test(compound)],
  ['dedicated projector consumes the existing upstream structure ADT', /import type \{ ExpressionStructure \}/.test(projector) && /switch \(structure\.kind\)/.test(projector)],
  ['projector performs projection only and does not arbitrate candidates or precedence', !/scannerExpressionCandidateAlgebra|resolvePhpExpressionRootOperator|resolveConditional/.test(projector.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''))],
  ['upstream exports the existing structure type instead of introducing a parallel contract', /ExpressionStructure.*scannerExpressionStructure/.test(index)],
  ['existing scanner integration tests cover precedence, coalescing, calls, and array access', /multiplication/.test(tests) && /null_coalesce/.test(tests) && /function_call/.test(tests) && /array_access/.test(tests)],
];
let failed = 0;
for (const [name, pass] of checks) {
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
  if (!pass) failed += 1;
}
const result = {
  phase: 1429,
  title: 'upstream-expression-model-projection',
  checks: checks.map(([name, passed]) => ({ name, passed })),
  passed: checks.length - failed,
  total: checks.length,
  status: failed === 0 ? 'passed_with_build_pending' : 'failed',
};
const report = path.join(root, 'scripts/audits/reports/phase1429-upstream-expression-model-projection.json');
fs.mkdirSync(path.dirname(report), { recursive: true });
fs.writeFileSync(report, JSON.stringify(result, null, 2) + '\n');
process.stdout.write(`${result.passed}/${result.total} checks passed\n`);
process.exitCode = failed === 0 ? 0 : 1;
