const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const controller = read('src/compiler/scanner/subscanners/ControllerScanner.ts');
const route = read('src/compiler/scanner/lexer/routeAst/semanticRouteSyntaxRelations.ts');
const checks = {
  controllerDiscoversCanonicalSourceFiles: controller.includes("const files = await collectPhpFiles(controllerDirectory);") && controller.includes("path.join(sourceRoot, 'app', 'Http', 'Controllers')"),
  controllerAccumulatorIsClosedRelationState: controller.includes('methods: [] as readonly') && controller.includes('index: [] as RelationIndex<string, ControllerActionInfo>'),
  controllerAccumulatorHasNoSelfReference: !controller.includes('return [...controllerMethods,'),
  routeConstraintUsesCanonicalParameterAst: route.includes('readonly parameter: RouteConstraintParameterAst'),
  routeConstraintUsesCanonicalValueAst: route.includes('createRouteConstraintValueAst(value)'),
  routeConstraintNoDuplicateArgumentShape: route.includes('type RouteConstraintSyntaxArgument = RouteConstraintArgumentAst'),
  routeGroupPresenceIsRefinedBeforeValue: route.includes('value is PresentGroupPendingKey') && route.includes('value => present(value.value)'),
  routeTargetFoldPreservesClosedAdt: route.includes("relationVariantFold<RouteTargetDescription, 'closure', RouteTargetAst>") && route.includes("'controller_action', RouteTargetAst"),
  routeTargetFoldConsumesNarrowedCandidate: route.includes('rest => relationVariantFold') && route.includes('remaining => relationVariantFold'),
};
const allPass = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ checks, allPass }, null, 2));
process.exitCode = allPass ? 0 : 1;
