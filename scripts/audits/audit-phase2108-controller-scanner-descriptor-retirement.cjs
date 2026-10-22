const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const adapter = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const actionScanner = read('packages/core/src/compiler/scanner/subscanners/controller/actionScanner.ts');
const executionContract = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const resolver = read('packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts');
const trace = read('docs/traces/PHASE2107_CONTROLLER_SCANNER_CANONICAL_ACTION_CONTRACT_TRACE.md');
const checks = [
  ['action scanner returns canonical contract and dependencies only', actionScanner.includes('contract: ControllerActionContract') && !actionScanner.includes('ControllerActionInfo') && !actionScanner.includes('ScannedControllerActionDescriptor')],
  ['legacy descriptor factory is not invoked by action scanner', !actionScanner.includes('ScannedControllerActionDescriptor.create')],
  ['execution result is descriptor-free', executionContract.includes('readonly contract: ControllerActionContract') && !executionContract.includes('ControllerActionInfo') && !executionContract.includes('compatibilityDescriptor')],
  ['wiring adapter forwards only canonical contract and dependencies', adapter.includes('contract: result.contract') && adapter.includes('dependencies: Object.freeze([...result.dependencies])') && !adapter.includes('descriptor')],
  ['scanner response projection reads canonical contract', scanner.includes('result.contract.response.responseTypeName()')],
  ['scanner resource projection reads canonical dataflow', scanner.includes('contract.dataflow.resourceBindings.map(binding => Object.freeze({')],
  ['scanner action identity reads canonical identity', scanner.includes('action: contract.identity.actionName')],
  ['scanner has no direct relations, foundation, or subscanner imports', !scanner.includes('semantic/relations') && !scanner.includes('semantic/foundation') && !scanner.includes('subscanners/')],
  ['legacy resolver remains explicitly visible in trace', trace.includes('resolveControllerActionContract') && trace.includes('does not claim the entire controller scanner dependency graph is free')],
  ['canonical resolver has no direct relation import after Phase 2110', !resolver.includes("semantic/relations/relationMembership") && !resolver.includes("semantic/relations/semanticRelations")],
  ['upstream interface still has compiler descriptor dependency recorded as migration target', executionContract.includes("../../compiler/scanner/descriptors/request/controllerActionContract") && trace.includes('dependency direction remains a separate interface-first migration target')],
  ['response integrated judgment still binds exact invocation judgment', scanner.includes('invocationJudgment,') && scanner.includes('judgeIntegratedResponse') && scanner.includes('astProjection.judge')],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
