const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const boundary = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const actionExecutionContract = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const actionJudgmentContract = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const adapter = read('packages/core/src/compiler/scanner/operations/controller/actionScanner.ts');
const resolver = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionContract.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const lattice = read('packages/core/src/semantic/relations/relationalSequence.ts');
const checks = [
  ['action execution result is a named completed judgment', actionExecutionContract.includes("readonly kind: 'controller_action_execution_completed'")],
  ['exact invocation judgment is retained in the result', actionExecutionContract.includes('readonly invocationJudgment: TInvocationJudgment') && boundary.includes('invocationJudgment: input.semanticJudgment.invocationJudgment')],
  ['canonical action contract is preserved through the executor boundary', actionExecutionContract.includes('readonly contract: TProjection') && boundary.includes('contract: input.semanticJudgment.contract')],
  ['legacy action scanner returns the canonical contract without reconstructing a descriptor', adapter.includes('return Object.freeze({ actionName: contract.identity.actionName, contract, dependencies: Object.freeze([...contract.dependencies])') && !adapter.includes('ScannedControllerActionDescriptor') && !adapter.includes('ControllerActionInfo')],
  ['action contract remains owned by the existing resolver', adapter.includes('resolveControllerActionContract(method, controllerName, fullPath') && resolver.includes('export interface ControllerActionContract')],
  ['source identity is passed from the invocation judgment into semantic judgment before execution', scanner.includes('invocationJudgment,\n                    method,') && boundary.includes('input.invocationJudgment.sourceFile') && adapter.includes('fullPath: SourceFile')],
  ['declaration closure gate precedes action execution', scanner.indexOf('if (declarationBlockers.length > 0)') < scanner.indexOf('this.executionDependencies.actionExecution.execute(')],
  ['scanner executes through the interface and not the legacy function', scanner.includes('this.executionDependencies.actionExecution.execute(') && !scanner.includes('scanControllerAction(')],
  ['response projection still correlates invocation and integrated response judgments', scanner.includes('judgment: invocationJudgment,\n                responseJudgment') && invocation.includes('LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>')],
  ['controller scanner has no direct relation/foundation/subscanner imports', !scanner.includes('semantic/relations') && !scanner.includes('semantic/foundation') && !scanner.includes('operations/')],
  ['fixed-point result is a discriminated union for convergence versus round-limit', lattice.includes("kind: 'fixed_point_converged'") && lattice.includes("kind: 'fixed_point_round_limit_reached'")],
  ['fixed-point rounds count evaluated transfer applications', lattice.includes('const rounds = completedRounds + 1') && lattice.includes('Number of transfer applications actually evaluated')],
  ['zero or exhausted round limit returns without claiming convergence', lattice.includes('if (completedRounds >= maxRounds)') && lattice.includes('converged: false, limit: maxRounds')],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
