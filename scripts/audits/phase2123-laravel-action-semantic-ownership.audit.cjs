const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const check = (name, condition, detail) => checks.push({ name, passed: Boolean(condition), detail });

const actionInterface = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const executionInterface = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const response = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const controller = read('packages/core/src/types/upstream/controller.ts');
const variableAuthority = read('packages/core/src/types/upstream/controllerDataflowVariableIdentityAuthority.ts');

check('action judgment interface has a named completed judgment', actionInterface.includes("kind: 'controller_action_semantic_judgment_completed'"), 'Action output is a typed judgment value.');
check('action judgment retains exact invocation judgment subtype', actionInterface.includes('invocationJudgment: TInvocationJudgment'), 'Generic correlation is present in the output contract.');
check('action response is canonical response ADT', actionInterface.includes('readonly response: ControllerResponse'), 'Action output references the existing ControllerResponse ADT.');
check('runtime input accepts one complete semantic judgment', executionInterface.includes('readonly semanticJudgment: LaravelControllerActionSemanticJudgment<TProjection, TInvocationJudgment>'), 'Executor does not receive parser evidence or loose fields.');
check('runtime result preserves the exact judgment object', executionInterface.includes('readonly semanticJudgment: LaravelControllerActionSemanticJudgment<TProjection, TInvocationJudgment>'), 'Executor result retains the judgment as one indivisible value.');
check('legacy action semantic owner remains in dependency composition', dependencies.includes("import { scanControllerAction } from '../operations/controller'"), 'Known remaining migration boundary; not falsely reported as retired.');
check('legacy action semantic owner is still invoked by judge implementation', /judge:[\s\S]*?scanControllerAction\(/.test(dependencies), 'Action judgment implementation still delegates semantic construction to scanControllerAction.');
check('scanner sends judgment through runtime executor', scanner.includes('this.executionDependencies.actionExecution.execute({') && scanner.includes('semanticJudgment,'), 'Scanner invokes the existing executor with the judgment.');
check('integrated response is judged through its existing pipeline', scanner.includes('this.responseSemanticPipeline.judgeIntegratedResponse('), 'Response integration is a distinct pipeline stage.');
check('integrated response receives the exact invocation judgment', /judgeIntegratedResponse\(Object\.freeze\(\{[\s\S]*?invocationJudgment,[\s\S]*?declarationEvidence/.test(scanner), 'Response integration consumes the same invocation judgment and declaration evidence.');
check('invocation judgment is a closed four-outcome ADT', ['LaravelControllerInvocationNotConnectedJudgment', 'LaravelControllerInvocationSourceBindingRejectedJudgment', 'LaravelControllerInvocationCompleteJudgment', 'LaravelControllerInvocationBlockedJudgment'].every((name) => invocation.includes(name)), 'Not-connected, rejected, complete, and blocked outcomes are named.');
check('ControllerResponse remains a discriminated union', controller.includes("kind: 'response_present'") && controller.includes("kind: 'response_absent'"), 'Response presence/absence is represented by explicit variants.');
check('relation utility is still directly used in upstream controller semantics', variableAuthority.includes("../../semantic/relations/relationalSequence") && variableAuthority.includes('relationOptionFold'), 'Do not claim semantic/relations is retired across the controller/upstream path.');
check('no replacement relation/foundation subscanner directory was introduced', !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/relation')) && !fs.existsSync(path.join(root, 'packages/core/src/compiler/scanner/operations/foundation')), 'No prohibited replacement subscanner was added.');

const failed = checks.filter((item) => !item.passed);
for (const item of checks) console.log(`${item.passed ? 'PASS' : 'FAIL'} ${item.name} — ${item.detail}`);
console.log(`RESULT ${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) process.exitCode = 1;
