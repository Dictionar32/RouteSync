const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const judgment = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const execution = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const cli = read('packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts');
const astRuntime = read('packages/core/src/compiler/frontend/php/astClassifierRuntime.ts');
const invocationContract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const fixedPointContract = read('packages/core/src/compiler/analysis/dataflow/controlFlowDataFlowInterface.ts');
const fixedPointJudgment = read('packages/core/src/compiler/analysis/dataflow/dataFlowSolveJudgment.ts');
const responseContract = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const executionInput = execution.split('export interface LaravelControllerActionExecutionInput<')[1]?.split('export interface LaravelControllerActionExecutionResult<')[0] ?? '';
const checks = [
  ['action input carries the exact invocation judgment as upstream evidence', /interface LaravelControllerActionSemanticJudgmentInput<[\s\S]*?readonly invocationJudgment:\s*TInvocationJudgment/.test(judgment)],
  ['action input no longer accepts an independently supplied sourceFile', !/interface LaravelControllerActionSemanticJudgmentInput<[\s\S]*?readonly sourceFile:\s*SourceFile/.test(judgment.split('export interface LaravelControllerActionSemanticJudgmentInterface<')[0])],
  ['action judgment retains the invocation ADT without a duplicate source identity', /interface LaravelControllerActionSemanticJudgmentInterface<[\s\S]*?readonly invocationJudgment:\s*TInvocationJudgment;/.test(judgment) && !/interface LaravelControllerActionSemanticJudgmentInterface<[\s\S]*?readonly sourceFile:\s*SourceFile/.test(judgment)],
  ['authority interface declares source-correlation ownership', /readonly sourceCorrelation:\s*'action-judgment-retains-the-exact-invocation-judgment-and-source-identity-supplied-as-input'/.test(judgment)],
  ['runtime executor input accepts one complete action judgment, not parallel judgments', /readonly semanticJudgment:\s*LaravelControllerActionSemanticJudgmentInterface<TProjection, TInvocationJudgment>/.test(executionInput) && !/readonly invocationJudgment:/.test(executionInput)],
  ['executor output forwards the exact completed action judgment without flattening it', /semanticJudgment:\s*input\.semanticJudgment/.test(dependencies) && /readonly semanticJudgment:\s*LaravelControllerActionSemanticJudgmentInterface<TProjection, TInvocationJudgment>/.test(execution)],
  ['executor contract declares its forwarding-only correlation responsibility', /readonly inputCorrelation:\s*'executor-accepts-one-action-judgment-that-already-owns-the-exact-invocation-judgment'/.test(execution)],
  ['legacy adapter sources source identity from the invocation judgment without duplicating it in output', /input\.invocationJudgment\.sourceFile/.test(dependencies) && !/sourceFile:\s*input\.invocationJudgment\.sourceFile/.test(dependencies)],
  ['scanner supplies invocation judgment before action analysis', /actionJudgment\.judge\(\s*\{\s*invocationJudgment,\s*method,/.test(scanner)],
  ['scanner does not independently re-supply invocation judgment to executor', /actionExecution\.execute\(\s*\{\s*semanticJudgment,\s*\}\)/.test(scanner)],
  ['CLI still closes inventory through upstream authority before manifest projection', /laravelControllerInvocationSemanticJudgmentInventoryAuthority\.close/.test(cli) && /manifestBuilder\.build\(terminalOutcome\.result\.receipt,\s*routeSourceSelection\)/.test(cli)],
  ['interface and executor contract contain no semantic branch implementation', !/\b(if|switch|case)\s*\(/.test(judgment + execution)],
  ['AST classifier parenthesized rule uses a typed judgment branch', /EXPRESSION_CANDIDATE\.parenthesized, \{ kind: 'judgment'/.test(astRuntime) && !/parenthesized[\s\S]{0,240}RelationOption/.test(astRuntime)],
  ['invocation judgment preserves all four integrated-response outcomes', ['php_source_invocation_integration_not_connected', 'php_source_invocation_integration_source_binding_rejected', 'php_source_invocation_integration_complete', 'php_source_invocation_integration_blocked'].every(kind => invocationContract.includes(kind))],
  ['integrated response remains indexed by the exact invocation judgment', responseContract.includes('LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>') || responseContract.includes('LaravelControllerInvocationSemanticJudgmentInterface')],
  ['fixed-point interface exposes judgment APIs instead of hiding solver outcomes', fixedPointContract.includes('analyzeWithJudgment') && fixedPointContract.includes('analyzeBackwardWithJudgment') && fixedPointJudgment.includes('fixed_point_round_limit_reached') && fixedPointJudgment.includes('fixed_point_converged')],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('KNOWN DEBT: production action judgment remains adapted from scanControllerAction in a controller subscanner; this audit does not claim subscanner retirement.\n');
process.exitCode = failures === 0 ? 0 : 1;
