const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const assert = (name, condition) => checks.push({ name, passed: Boolean(condition) });

const judgmentPath = 'packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts';
const executionPath = 'packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts';
const wiringPath = 'packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts';
const judgment = read(judgmentPath);
const execution = read(executionPath);
const wiring = read(wiringPath);

assert('upstream judgment interface does not import compiler contract', !/from ['"][^'"]*compiler\/scanner\/descriptors\/request\/controllerActionContract['"]/.test(judgment));
assert('upstream judgment interface does not import compiler AST types', !/from ['"][^'"]*compiler\/scanner\/lexer\/controllerAstTypes['"]/.test(judgment));
assert('upstream execution interface does not import compiler contract', !/from ['"][^'"]*compiler\/scanner\/descriptors\/request\/controllerActionContract['"]/.test(execution));
assert('source evidence is generic at upstream judgment boundary', /LaravelControllerActionSemanticJudgmentInput<TMethodEvidence, TParameterEvidence, TInvocationJudgment>/.test(judgment));
assert('semantic projection is generic at upstream judgment boundary', /LaravelControllerActionSemanticJudgment<TProjection, TInvocationJudgment>/.test(judgment));
assert('executor forwards generic projection without semantic branching', /contract: TProjection/.test(execution) && !/\bif\s*\(/.test(execution));
assert('compiler composition specializes source evidence and projection types', /LaravelControllerActionSemanticJudgmentInterface<ControllerActionContract, ControllerMethodAst, ControllerParameterAst>/.test(wiring));
assert('compiler composition specializes executor projection type', /LaravelControllerActionExecutionInterface<ControllerActionContract>/.test(wiring));
assert('judgment result remains a closed discriminated variant', /kind: 'controller_action_semantic_judgment_completed'/.test(judgment));
assert('execution result remains a closed discriminated variant', /kind: 'controller_action_execution_completed'/.test(execution));

for (const check of checks) console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name}`);
console.log(`RESULT ${checks.filter(check => check.passed).length}/${checks.length}`);
if (checks.some(check => !check.passed)) process.exitCode = 1;
