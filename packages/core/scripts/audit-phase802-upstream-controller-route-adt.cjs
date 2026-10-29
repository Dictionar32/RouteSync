const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const controller = read('src/compiler/scanner/wiring/laravelControllerScanner.ts');
const route = read('src/compiler/frontend/php/routeAst/semanticRouteSyntaxRelations.ts');
const checks = {
  controllerConsumesClosedSourceInventory: controller.includes('LaravelControllerScanInput') && controller.includes('input.invocationInventory') && controller.includes('invocationInventoryReceipt.correspondences'),
  controllerAccumulatorIsClosedRelationState: controller.includes('controllers: [] as LaravelControllerScanArtifact[]') && controller.includes('invocationJudgment,') && controller.includes('controllers: [...state.controllers, artifact]'),
  controllerDoesNotRebuildLegacyControllerIndex: !controller.includes('controllerIndex') && !controller.includes('RelationIndex<string, RelationIndex<string, ControllerActionInfo>>'),
  routeConstraintUsesCanonicalParameterAst: route.includes('readonly parameter: RouteConstraintParameterAst'),
  routeConstraintUsesCanonicalValueAst: route.includes('createRouteConstraintValueAst(value)'),
  routeConstraintNoDuplicateArgumentShape: route.includes('type RouteConstraintSyntaxArgument = RouteConstraintArgumentAst'),
  routeGroupPresenceIsRefinedBeforeValue: route.includes('presenceFold') && route.includes('present('),
  routeTargetFoldPreservesClosedAdt: route.includes("relationVariantFold<RouteTargetDescription, 'closure', RouteTargetAst>") && route.includes("'controller_action', RouteTargetAst"),
  routeTargetFoldConsumesNarrowedCandidate: route.includes('rest => relationVariantFold') && route.includes('remaining => relationVariantFold'),
};
const allPass = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ checks, allPass }, null, 2));
process.exitCode = allPass ? 0 : 1;
