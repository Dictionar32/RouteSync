const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const scanner = read('packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts');
const routeEmitter = read('packages/core/src/compiler/scanner/subscanners/route-scanner/routeEmitter.ts');
const controllerInterface = read('packages/core/src/types/upstream/laravelControllerScannerInterface.ts');
const routeInterface = read('packages/core/src/types/upstream/laravelRouteScannerInterface.ts');
const manifest = read('packages/core/src/types/upstream/manifest.ts');
const manifestFlow = read('packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts');
const responsePipeline = read('packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts');
const report = read('packages/core/src/types/upstream/docs/PHASE2404_ROUTE_TARGET_PROJECTION_AUTHORITY_AUDIT.md');
const checks = [
  ['canonical action publication carries semantic judgment and source provenance', controllerInterface.includes('interface ControllerActionJudgmentPublication') && controllerInterface.includes('readonly source: SourceSpan;') && controllerInterface.includes('readonly judgment: LaravelControllerActionSemanticJudgmentInterface;')],
  ['canonical action publication does not falsely claim to carry ControllerActionInfo', !controllerInterface.slice(controllerInterface.indexOf('interface ControllerActionJudgmentPublication'), controllerInterface.indexOf('/** Route-side correlation')).includes('ControllerActionInfo')],
  ['resource emitter has retired the unreachable legacy ControllerActionInfo map', !routeEmitter.includes('controllerMap: RelationOption<RelationIndex<string, RelationIndex<string, ControllerActionInfo>>>') && routeEmitter.includes("kind: 'controller_reference' as const")],
  ['active scanner no longer passes absent controller map to resource emitter', !scanner.includes('relationNone(),\n        unresolvedResponse,')],
  ['route correlation authority is called after target selection, not as target projection', scanner.includes('actionJudgmentForTarget(target, publications, correlationAuthority)')],
  ['active scanner still imports the route emitter from subscanners', scanner.includes("from '../subscanners/route-scanner'")],
  ['active scanner still imports route producer composition from subscanners', scanner.includes("from '../subscanners/routeProducerRelations'")],
  ['route scanner interface exposes producer composition but no route-boundary projection operation', routeInterface.includes('readonly routeProducerInputComposition: RouteProducerInputComposition;') && !routeInterface.includes('routeBoundaryProjection')],
  ['existing integrated HTTP response authority remains explicit', responsePipeline.includes('judgeIntegratedResponse')],
  ['concrete manifest owns invocation semantic judgments', manifest.includes('readonly invocationSemanticJudgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[];')],
  ['manifest flow reads judgments from the concrete manifest rather than AST', manifestFlow.includes('invocationSemanticJudgments: manifest.invocationSemanticJudgments') && !manifestFlow.includes('manifest.ast.ast.controllerInvocationSemanticInventory')],
  ['report explicitly distinguishes audit from implementation closure', report.includes('not a claim that the route path has been fully repaired') && report.includes('The active path lacks an explicit, existing owner')],
];
let failures = 0;
for (const [name, passed] of checks) {
  process.stdout.write(`${passed ? 'PASS' : 'FAIL'} ${name}\n`);
  failures += Number(!passed);
}
process.stdout.write(`\n${checks.length - failures}/${checks.length} checks passed\n`);
process.stdout.write('Interpretation: invocation/manifest ownership remains closed structurally; route target projection and subscanner ownership remain open.\n');
process.exitCode = Number(failures > 0);
