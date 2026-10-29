const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const wiring = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const execution = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const judgment = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const actionScanner = read('packages/core/src/compiler/scanner/operations/controller/actionScanner.ts');
const resolver = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const trace = read('docs/traces/PHASE2109_CONTROLLER_ACTION_JUDGMENT_EXECUTOR_SEPARATION_TRACE.md');
const checks = [
  ['upstream semantic judgment interface exists', judgment.includes('interface LaravelControllerActionSemanticJudgmentInterface') && judgment.includes("kind: 'laravel_controller_action_semantic_judgment_authority'")],
  ['judgment input derives source identity from its invocation judgment', judgment.includes('readonly invocationJudgment: TInvocationJudgment') && !/interface LaravelControllerActionSemanticJudgmentInput<[\s\S]*?readonly sourceFile: SourceFile/.test(judgment.split('export interface LaravelControllerActionSemanticJudgment<')[0])],
  ['judgment output carries generic canonical action contract and invocation provenance', judgment.includes('readonly contract: TProjection') && judgment.includes('readonly invocationJudgment: TInvocationJudgment')],
  ['judgment output is discriminated', judgment.includes("kind: 'controller_action_semantic_judgment_completed'")],
  ['execution input accepts only the completed correlated judgment', execution.includes('readonly semanticJudgment: LaravelControllerActionSemanticJudgment<TProjection, TInvocationJudgment>') && !/interface LaravelControllerActionExecutionInput<[\s\S]*?readonly invocationJudgment:/.test(execution.split('export interface LaravelControllerActionExecutionResult<')[0])],
  ['execution input no longer accepts raw method AST', !execution.includes('ControllerMethodAst') && !execution.includes('formRequestIndex')],
  ['scanner obtains judgment before executor', scanner.indexOf('actionJudgment.judge({') < scanner.indexOf('actionExecution.execute({')],
  ['action judgment owns invocation source identity', wiring.includes('input.invocationJudgment.sourceFile') && scanner.includes('invocationJudgment,\n                    method,')],
  ['executor only forwards semantic result', wiring.includes('actionExecution: Object.freeze({') && wiring.includes('contract: input.semanticJudgment.contract') && !wiring.slice(wiring.indexOf('actionExecution: Object.freeze({'), wiring.indexOf('controllerProducer,')).includes('scanControllerAction(')],
  ['legacy resolver call is confined to judgment authority wiring', wiring.includes('actionJudgment: Object.freeze({') && wiring.includes('const result = scanControllerAction(')],
  ['action scanner still delegates legacy resolver explicitly', actionScanner.includes('resolveControllerActionContract(')],
  ['legacy response helper still exposes transitive relation debt', read('packages/core/src/compiler/scanner/operations/controller/responseAttributeScanner.ts').includes("semantic/relations/relationMembership") && read('packages/core/src/compiler/scanner/operations/controller/responseAttributeScanner.ts').includes("semantic/relations/relationalSequence")],
  ['compiler-owned contract dependency debt is documented', trace.includes('LaravelControllerActionSemanticJudgmentInterface` currently imports `ControllerActionContract`')],
  ['runtime executor contract documents forwarding-only role', execution.includes('only correlates and forwards')],
  ['integrated response projection remains after execution', scanner.includes('judgeIntegratedResponse') && scanner.includes('invocationJudgment,')],
  ['no direct relation/foundation/subscanner import added to main scanner', !scanner.includes('semantic/relations') && !scanner.includes('semantic/foundation') && !scanner.includes('operations/')],
  ['upstream barrel exports semantic judgment interface', read('packages/core/src/types/upstream/index.ts').includes("export * from './laravelControllerActionSemanticJudgmentInterface';")],
  ['package entry exports semantic judgment interface', read('packages/core/src/index.ts').includes("from './types/upstream/laravelControllerActionSemanticJudgmentInterface'")],
  ['trace states no build/typecheck/vitest claim', trace.includes('Build, typecheck, and Vitest are not run')],
  ['trace explicitly records remaining legacy seam', trace.includes('still calls `scanControllerAction`')],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
