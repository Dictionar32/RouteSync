const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const composition = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const contract = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const upstreamIndex = read('packages/core/src/types/upstream/index.ts');
const publicIndex = read('packages/core/src/index.ts');
const checks = [
  ['action execution contract is declared in upstream types, not the wiring module', contract.includes('export interface LaravelControllerActionExecutionInterface') && !composition.includes('export interface LaravelControllerActionExecutionInterface')],
  ['executor input carries the exact canonical invocation judgment', contract.includes('readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface')],
  ['executor result retains the canonical ControllerActionContract', contract.includes('readonly contract: ControllerActionContract')],
  ['action execution result no longer constructs or exposes a legacy descriptor', !contract.includes('ControllerActionInfo') && !contract.includes('compatibilityDescriptor') && !composition.includes('compatibilityDescriptor')],
  ['scanner response projection reads contract.response', scanner.includes('name: result.contract.response.responseTypeName()')],
  ['scanner resource binding projection reads contract.dataflow', scanner.includes('({ contract }) => contract.dataflow.resourceBindings.map(binding => Object.freeze({')],
  ['scanner action identity comes from canonical contract identity', scanner.includes('action: contract.identity.actionName')],
  ['scanner does not consume a compatibility descriptor', !scanner.includes('descriptor') && !scanner.includes('compatibilityDescriptor')],
  ['scanner has no direct imports from relations, foundation, or operations', !scanner.includes('semantic/relations') && !scanner.includes('semantic/foundation') && !scanner.includes('operations/')],
  ['wiring is the composition adapter for the upstream execution interface', composition.includes("import type { LaravelControllerActionExecutionInput, LaravelControllerActionExecutionInterface, LaravelControllerActionExecutionResult } from '../../../types/upstream/laravelControllerActionExecutionInterface'") && composition.includes("import { scanControllerAction } from '../operations/controller'")],
  ['upstream barrel exports the action execution contract', upstreamIndex.includes("export * from './laravelControllerActionExecutionInterface';")],
  ['package public entry exports the action execution contract', publicIndex.includes('LaravelControllerActionExecutionInterface') && publicIndex.includes('LaravelControllerActionExecutionResult')],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
