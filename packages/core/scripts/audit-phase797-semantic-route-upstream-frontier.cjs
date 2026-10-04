const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const semantic = path.join(root, 'src/compiler/scanner/lexer/routeAst/semanticRouteSyntaxRelations.ts');
const scanner = path.join(root, 'src/compiler/scanner/subscanners/scannerUtils.ts');
const read = file => fs.readFileSync(file, 'utf8');
const s = read(semantic);
const u = read(scanner);
const checks = {
  relationEqualImported: /relationEqual/.test(s),
  resolverIsCallableType: /type RouteTargetMethodResolver = \(/.test(s),
  constraintStrategyIsCallableType: /type ConstraintStrategy = \(/.test(s),
  constraintValuesUseClosedAst: /readonly RouteConstraintValueAst\[\]/.test(s),
  constraintValueFactoryUsed: /createRouteConstraintValueAst/.test(s),
  cursorVoidDoesNotEnterTokenClassifier: !/tokenHasKind\(at\.next|tokenHasKind\(value\.current/.test(s),
  targetDescriptionClosedBuilders: /targetCandidate\(\{ kind: 'controller_action'/.test(s),
  targetAstUsesVariantFold: /relationVariantFold\(description/.test(s),
  invocationRequirementsClosed: /interface RouteInvocationRequirements/.test(s),
  semanticFactsClosedBuilders: /routePathSemanticFact|routeConstraintSemanticFact|routeTargetSemanticFact|routeInvocationSemanticFact/.test(s),
  noUnsafeAsInSemantic: !/\bas\s+(unknown|any|RouteTargetAst|const)\b/.test(s),
  scannerReadOnlyContract: /Promise<readonly string\[\]>/.test(u),
};
const allPass = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 797, checks, allPass }, null, 2));
process.exit(allPass ? 0 : 1);
