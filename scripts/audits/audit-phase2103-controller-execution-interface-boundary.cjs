const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const dependencies = read('packages/core/src/compiler/scanner/wiring/laravelControllerExecutionDependencies.ts');
const actionExecutionContract = read('packages/core/src/types/upstream/laravelControllerActionExecutionInterface.ts');
const actionJudgmentContract = read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts');
const producer = read('packages/core/src/compiler/scanner/subscanners/controller/controllerProducer.ts');
const producerContract = read('packages/core/src/types/upstream/controllerProducerInterface.ts');
const scanContract = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const declarationContract = read('packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts');
const responseContract = read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts');
const checks = [
  ['controller scanner has no direct semantic/relations imports', !scanner.includes('semantic/relations')],
  ['controller scanner has no direct semantic/foundation imports', !scanner.includes('semantic/foundation')],
  ['controller scanner has no direct subscanner imports', !scanner.includes('subscanners/')],
  ['action execution boundary is an explicit interface', actionExecutionContract.includes('export interface LaravelControllerActionExecutionInterface') && actionExecutionContract.includes("readonly kind: 'laravel_controller_action_execution'")],
  ['semantic judgment receives typed source identity and method evidence before execution', actionJudgmentContract.includes('readonly method: ControllerMethodAst') && actionJudgmentContract.includes('readonly sourceFile: SourceFile') && actionExecutionContract.includes('readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface') && scanner.includes('sourceFile: invocationJudgment.sourceFile')],
  ['action execution returns typed action identity, canonical contract, and dependencies without descriptor', actionExecutionContract.includes('readonly actionName: ActionName') && actionExecutionContract.includes('readonly contract: ControllerActionContract') && actionExecutionContract.includes('readonly dependencies: readonly ControllerDependency[]') && !actionExecutionContract.includes('ControllerActionInfo')],
  ['scanner invokes the interface rather than scanControllerAction directly', scanner.includes('this.executionDependencies.actionExecution.execute(') && !scanner.includes('scanControllerAction(')],
  ['legacy implementation is explicitly isolated in the composition module', dependencies.includes("from '../subscanners/controller'") && dependencies.includes('legacyLaravelControllerExecutionDependencies')],
  ['controller producer publishes actions as a domain array instead of a relation Sequence', /readonly actions: readonly ControllerActionFlowContract\[\]/.test(producerContract) && /const actions: readonly ControllerActionFlowContract\[\] = Object\.freeze\(\[\.\.\.methodValues\]\)/.test(producer)],
  ['controller producer no longer imports semantic relations', !producer.includes('semantic/relations')],
  ['declaration blocker gate precedes injected action execution', scanner.indexOf('if (declarationBlockers.length > 0)') < scanner.indexOf('this.executionDependencies.actionExecution.execute(')],
  ['invocation judgment remains attached to producer and response judgment inputs', scanner.includes('produce({ declaration: declarationEvidence, invocationJudgment })') && scanner.includes('invocationJudgment,\n                declarationEvidence')],
  ['integrated response judgment remains correlated with AST projection', scanner.includes('judgment: invocationJudgment,\n                responseJudgment') && responseContract.includes('LaravelControllerAstProjectionResponseJudgment<InvocationJudgment>')],
  ['source-bearing declaration correspondence remains canonical', declarationContract.includes('ControllerDeclarationSemanticCorrespondence<TSource, TMethod, TAttribute>') && scanner.includes('semanticSelection: correspondence.selection')],
  ['public scan outcome remains closed complete/blocked ADT', scanContract.includes('export type LaravelControllerScanJudgment =\n  |') && scanContract.includes("kind: 'laravel_controller_scan_blocked'")],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`RESULT ${checks.length - failures}/${checks.length}\n`);
process.exitCode = failures === 0 ? 0 : 1;
