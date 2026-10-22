const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const controller = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const response = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const route = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const emitter = read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts');
const report = read('packages/core/src/types/upstream/docs/PHASE2407_INTEGRATED_RESPONSE_ROUTE_PROJECTION_OWNERSHIP.md');
const checks = [
  ['controller producer runs before integrated response judgment', controller.indexOf('controllerProducer.produce(') >= 0 && controller.indexOf('controllerProducer.produce(') < controller.indexOf('this.responseSemanticPipeline.judgeIntegratedResponse(')],
  ['canonical action publication retains separate semantic judgment and projection', read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts').includes('readonly judgment: LaravelControllerActionSemanticJudgmentInterface') && read('packages/core/src/types/upstream/laravelControllerActionSemanticJudgmentInterface.ts').includes('readonly projection: TProjection')],
  ['integrated response pipeline explicitly retains unresolved response descriptor coverage', response.includes("'resolved_response_attribute_descriptor'") || response.includes('resolved_response_attribute_descriptor')],
  ['route emitter still requires legacy ControllerActionInfo projection', emitter.includes('readonly action: ControllerActionInfo') && emitter.includes('controllerMap: RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>>')],
  ['active route scanner still supplies absent controller map', route.includes('relationNone()') && route.includes('emitResourceRouteBoundariesFromJudgment')],
  ['report identifies integrated response projection as upstream owner', report.includes('LaravelControllerResponseSemanticPipelineInterface') && report.includes('not a new runtime helper')],
  ['report does not claim route target closure', report.includes('does not claim the route-target gap is closed')],
  ['no foundation dependency introduced by phase files', !report.includes('core/src/semantic/foundation')],
];
let failed = false;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed ||= !passed;
}
process.stdout.write(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural assertions passed\n`);
process.exitCode = failed ? 1 : 0;
