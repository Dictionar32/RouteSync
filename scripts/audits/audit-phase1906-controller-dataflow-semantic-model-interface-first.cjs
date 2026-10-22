const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const modelPath = path.join(root, 'packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts');
const astPath = path.join(root, 'packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts');
const indexPath = path.join(root, 'packages/core/src/types/upstream/index.ts');
const analyzerPath = path.join(root, 'packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const model = fs.readFileSync(modelPath, 'utf8');
const ast = fs.readFileSync(astPath, 'utf8');
const index = fs.readFileSync(indexPath, 'utf8');
const analyzer = fs.readFileSync(analyzerPath, 'utf8');
const checks = [
  ['upstream value model is a non-callable interface', /export interface ControllerDataflowInvocationSemanticModelInterface/.test(model) && !/readonly (?:judge|analyze|resolve|execute)\s*:/.test(model)],
  ['canonical invocation judgment retained in model', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(model)],
  ['integrated composition result retained as one aggregate', /readonly invocationSemanticIntegratedResponse: InvocationSemanticIntegratedResponseCompositionResult/.test(model)],
  ['knowledge identity rule explicitly closed', /knowledgeIdentity: 'the-composition-result-retains-the-exact-knowledge-input/.test(model)],
  ['scanner AST extends upstream model rather than redeclaring fields', /interface ControllerDataflowAst extends ControllerDataflowInvocationSemanticModelInterface<SemanticKnowledgeDataFlow>/.test(ast) && !/readonly invocationJudgment:/.test(ast)],
  ['upstream barrel exports the canonical model', /export \* from '\.\/controllerDataflowInvocationSemanticModelInterface'/.test(index)],
  ['analyzer still passes judgment response into composition', /phpSourceInvocationPipeline: judgment\.response/.test(analyzer)],
];
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const failed = checks.filter(([, passed]) => !passed);
console.log(`RESULT ${checks.length - failed.length}/${checks.length}`);
process.exitCode = failed.length ? 1 : 0;
