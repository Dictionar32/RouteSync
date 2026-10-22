const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const boundary = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const ast = read('packages/core/src/compiler/scanner/lexer/controllerBodyAstTypes.ts');
const analyzer = read('packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts');
const binding = read('packages/core/src/compiler/scanner/wiring/controllerVariableSemanticRuntimeBinding.ts');
const body = read('packages/core/src/compiler/scanner/lexer/controllerBodyParser.ts');
const pkg = JSON.parse(read('package.json'));
const checks = [
  ['existing Laravel scanner boundary evolves in place to v69', /readonly version: 69/.test(boundary) && /version: 69,/.test(boundary)],
  ['existing boundary declares exact judgment retention through dataflow projection', /readonly dataflowJudgmentRetention: 'controller-dataflow-ast-retains-the-exact-canonical-invocation-judgment-alongside-integrated-response-projection-so-source-and-response-provenance-remain-a-single-traceable-authority-value'/.test(boundary) && /dataflowJudgmentRetention: 'controller-dataflow-ast-retains-the-exact-canonical-invocation-judgment-alongside-integrated-response-projection-so-source-and-response-provenance-remain-a-single-traceable-authority-value'/.test(boundary)],
  ['dataflow AST preserves the canonical judgment itself', /readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(ast)],
  ['analyzer accepts one judgment instead of detached response and source path', /judgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(analyzer) && /const filePath = judgment\.sourceFile\.value\.value/.test(analyzer) && /phpSourceInvocationPipeline: judgment\.response/.test(analyzer) && !/integratedResponse: InvocationPhpSourceIntegratedResponse/.test(analyzer) && !/filePath = '<php-source>'/.test(analyzer)],
  ['analyzer returns the exact judgment without rebuilding it', /invocationJudgment: judgment/.test(analyzer) && !/kind: 'laravel_controller_invocation_semantic_judgment'/.test(analyzer)],
  ['production binding forwards one judgment into analyzer', /createControllerDataflowAnalyzer\([\s\S]*?judgment,[\s\S]*?\)\(block, parameters, parameterSemantics\)/.test(binding)],
  ['body parser forwards canonical judgment unchanged', /analyzeControllerDataflowWithInvocationJudgment\(block, parameters, parameterSemantics, judgment\)/.test(body)],
  ['unused disconnected and source-binding-only analyzer entrypoints are not present', !/export const analyzeControllerDataflow =/.test(binding) && !/analyzeControllerDataflowFromPhpSourcePipeline/.test(binding)],
  ['canonical invocation judgment remains the single model', /export type LaravelControllerInvocationSemanticJudgmentInterface\s*=/.test(judgment) && !/InvocationSemanticJudgmentV2/.test(judgment + boundary + ast + analyzer + binding)],
  ['no semantic foundation dependency is introduced into the changed boundary', !/semantic\/foundation/.test(boundary + ast + analyzer + binding)],
  ['audit command is registered', pkg.scripts['audit:phase1902-controller-dataflow-canonical-judgment-retention'] === 'node scripts/audits/audit-phase1902-controller-dataflow-canonical-judgment-retention.cjs'],
  ['syntax-only projection remains separate from semantic execution', /kind === 'syntax_only'[\s\S]*dataflow: undefined/.test(body)],
];
const failed = checks.filter(([, pass]) => !pass);
for (const [name, pass] of checks) process.stdout.write(`${pass ? 'PASS' : 'FAIL'} ${name}\n`);
process.stdout.write(`RESULT ${checks.length - failed.length}/${checks.length}\n`);
if (failed.length) process.exitCode = 1;
