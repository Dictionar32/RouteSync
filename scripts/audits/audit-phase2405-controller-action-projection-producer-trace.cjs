const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts');
const routeScanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const controllerInterface = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const routeInterface = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const descriptor = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionDescriptor.ts');
const actionTypes = read('packages/core/src/compiler/scanner/operations/domain-model/request/controllerActionTypes.ts');
const emitter = read('packages/core/src/compiler/scanner/operations/route-scanner/routeEmitter.ts');
const report = read('packages/core/src/types/upstream/docs/PHASE2405_CONTROLLER_ACTION_PROJECTION_PRODUCER_TRACE.md');
const publicationStart = controllerInterface.indexOf('interface ControllerActionJudgmentPublication');
const publicationEnd = controllerInterface.indexOf('/** Route-side correlation', publicationStart);
const publication = controllerInterface.slice(publicationStart, publicationEnd);
const checks = [
  ['controller scan publishes existing semantic action flow products', controllerInterface.includes('readonly actions: readonly ControllerActionFlowContract[];')],
  ['controller scan separately publishes canonical source-correlated action judgments', controllerInterface.includes('readonly actionJudgments: readonly ControllerActionJudgmentPublication[];') && publication.includes('readonly source: SourceSpan;')],
  ['canonical publication intentionally omits compiler-side ControllerActionInfo', !publication.includes('ControllerActionInfo')],
  ['ControllerActionInfo remains an alias of the existing descriptor params contract', actionTypes.includes('export type ControllerActionInfo = ScannedControllerActionParams;')],
  ['descriptor factory exists but does not appear as a controller-scan publication dependency', descriptor.includes('export const ScannedControllerActionDescriptor') && !scanner.includes('ScannedControllerActionDescriptor')],
  ['active route scanner no longer passes an absent controller map', !routeScanner.includes('relationNone(),\n        unresolvedResponse,')],
  ['resource emitter no longer requires ControllerActionInfo map to choose controller_action', !emitter.includes('controllerMap: RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>>') && emitter.includes("kind: 'controller_reference' as const")],
  ['route correlation happens during boundary projection after target selection', routeScanner.includes('actionJudgmentForTarget(target, publications, correlationAuthority)')],
  ['route scanner interface has no injected action-projection producer operation', !routeInterface.includes('controllerActionProjection') && !routeInterface.includes('actionProjectionProducer')],
  ['report prohibits synthetic empty descriptor as a substitute', report.includes('must not be used to fill this gap') && report.includes('Reconstructing `ControllerActionInfo` from the semantic judgment alone is also invalid')],
  ['report preserves explicit unresolved status rather than claiming closure', report.includes('does **not** claim to close the route target projection gap')],
  ['runtime/CLI end-to-end verification is not falsely claimed', report.includes('live scan/sync CLI execution are not run here')],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed\n`);
process.exitCode = Number(failures > 0);
