const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const semantic = read('packages/core/src/types/upstream/laravelScannerSemanticJudgment.ts');
const resourceInterface = read('packages/core/src/types/upstream/laravelResourceScannerInterface.ts');
const controllerInterface = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const pipeline = read('packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts');
const checks = [
  ['resource scanner interface receives the closed controller scan judgment', /readonly controllerScan: LaravelControllerScanJudgment/.test(resourceInterface)],
  ['resource binding authority input receives correlated controller scan judgment', /interface ResourceModelBindingJudgmentInput[\s\S]*?readonly controllerScan: LaravelControllerScanJudgment/.test(semantic)],
  ['resource binding authority input no longer accepts detached controller action arrays', !/interface ResourceModelBindingJudgmentInput[\s\S]*?readonly controllerActions: readonly ControllerActionFlowContract\[\]/.test(semantic)],
  ['controller scan artifact retains action contracts and integrated invocation judgment together', /readonly actions: readonly ControllerActionFlowContract\[\][\s\S]*?readonly resourceBindings: readonly ControllerResourceBindingEvidence\[\][\s\S]*?readonly invocationJudgment: LaravelControllerInvocationSemanticJudgmentInterface/.test(controllerInterface)],
  ['invocation response remains part of the semantic judgment contract', /readonly response: PhpSourceInvocationSemanticPipelineIntegrationResult/.test(read('packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInterface.ts'))],
  ['controller scan keeps source-correlated resource return evidence beside invocation judgment', /readonly resourceBindings: readonly ControllerResourceBindingEvidence\[\]/.test(controllerInterface) && /descriptor\.dataflow\.resourceBindings/.test(read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts'))],
  ['production route wiring already consumes controllerScan rather than detached action list', /laravelRouteScanner\.scan\(\{\s*controllerScan,/s.test(pipeline)],
  ['resource interface does not depend on semantic foundation', !/semantic\/foundation/.test(resourceInterface) && !/semantic\/foundation/.test(semantic)],
  ['resource binding authority still models unresolved and ambiguous outcomes', /kind: 'unresolved'[\s\S]*?kind: 'ambiguous'/.test(semantic)],
  ['model-binding input remains source evidence and relation based, not prefilled ResourceDefinition', /readonly subject: ResourceModelBindingSubject;[\s\S]*?readonly models: readonly ModelDefinition\[\];[\s\S]*?readonly controllerScan: LaravelControllerScanJudgment;[\s\S]*?readonly relations: readonly ResourceRelationBindingEvidence\[\]/.test(semantic)],
];
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`);
const passed = checks.filter(([, value]) => value).length;
console.log(`${passed}/${checks.length} checks passed`);
if (passed !== checks.length) process.exitCode = 1;
