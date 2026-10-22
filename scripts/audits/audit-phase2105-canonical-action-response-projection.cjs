const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const boundary = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const actionExecutionContract = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const actionScanner = read('packages/core/src/compiler/scanner/subscanners/controller/actionScanner.ts');
const invocation = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const response = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const lattice = read('packages/core/src/semantic/relations/relationalSequence.ts');
const checks = [
  ['controller action response projection reads the canonical action contract', scanner.includes('name: result.contract.response.responseTypeName()')],
  ['controller action response projection does not use the compatibility descriptor as authority', !scanner.includes('name: result.descriptor.response.responseTypeName()')],
  ['action execution result retains the canonical contract and exact invocation judgment', actionExecutionContract.includes('readonly contract: ControllerActionContract') && actionExecutionContract.includes('readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface')],
  ['legacy adapter preserves resolver contract without constructing a compatibility descriptor', actionScanner.includes('return Object.freeze({ actionName: contract.identity.actionName, contract, dependencies: Object.freeze([...contract.dependencies]) })') && !actionScanner.includes('ScannedControllerActionDescriptor')],
  ['invocation judgment owns source identity and an outcome-indexed integrated response', invocation.includes('readonly sourceFile: SourceFile') && invocation.includes('readonly response: Extract<PhpSourceInvocationSemanticPipelineIntegrationResult')],
  ['AST response projection is indexed by the exact invocation judgment', invocation.includes('LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>')],
  ['response semantics have a separate canonical product ADT', response.includes('export type LaravelControllerResponseSemanticProduct =') && response.includes("readonly kind: 'object_response'")],
  ['controller scanner does not import relations, foundation, or subscanners directly', !scanner.includes('semantic/relations') && !scanner.includes('semantic/foundation') && !scanner.includes('subscanners/')],
  ['fixed-point result distinguishes convergence from round-limit exhaustion', lattice.includes("kind: 'fixed_point_converged'") && lattice.includes("kind: 'fixed_point_round_limit_reached'")],
  ['fixed-point result counts actual transfer applications', lattice.includes('const rounds = completedRounds + 1')],
  ['fixed-point cap is represented as non-converged rather than closed', lattice.includes('converged: false, limit: maxRounds')],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
