const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const emitter = read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts');
const route = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const correlation = read('packages/core/src/types/upstream/laravelControllerActionRouteCorrelationAuthority.ts');
const report = read('packages/core/src/types/upstream/docs/PHASE2408_RESOURCE_ROUTE_EMPTY_MAP_RETIREMENT.md');
const checks = [
  ['resource emitter no longer accepts the unreachable nested controller map', !emitter.includes('controllerMap: RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>>')],
  ['resource emitter no longer imports RelationIndex lookup machinery', !emitter.includes('relationIndexLookup') && !emitter.includes('RelationIndex<')],
  ['resource target selection is explicit from the available controller identity', emitter.includes("name => ({ kind: 'controller_reference' as const, controllerName: name, actionName: planned.action, response: resolvedResponse })")],
  ['recursive emitter call uses the reduced operation contract', emitter.includes('emitResourceRouteBoundariesFromJudgment(judgment, controllerName, resolvedResponse, authorization')],
  ['active route scanner no longer passes a controller-map argument', route.includes('emitResourceRouteBoundariesFromJudgment(\n        resource,') && !route.includes('relationNone(),\n        unresolvedResponse')],
  ['route callback still correlates target through the existing authority', route.includes('actionJudgmentForTarget(target, publications, correlationAuthority)')],
  ['canonical action correlation authority remains an existing upstream contract', correlation.includes('controller_action_route_correlation_authority')],
  ['report explicitly records the remaining integrated-response blocker', report.includes('resolved_response_attribute_descriptor') && report.includes('Still open')],
  ['report does not claim end-to-end closure', report.includes('No claim is made that route response semantics or end-to-end interface-first closure is complete')],
  ['no foundation dependency was introduced', !emitter.includes('semantic/foundation') && !route.includes('semantic/foundation')],
];
let failed = false;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failed ||= !passed;
}
process.stdout.write(`${checks.filter(([, passed]) => passed).length}/${checks.length} structural assertions passed\n`);
process.exitCode = failed ? 1 : 0;
