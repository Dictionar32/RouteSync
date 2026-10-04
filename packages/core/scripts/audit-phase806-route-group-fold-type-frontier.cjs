const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'src/compiler/scanner/lexer/routeAst/routeDeclarationParser.ts');
const source = fs.readFileSync(file, 'utf8');
const checks = {
  consumesUpstreamArgument: source.includes('argument: RouteConstraintArgument'),
  explicitClosedResult: source.includes("relationVariantFold<RouteConstraintArgument, 'pattern', RouteConstraintArgumentAst>"),
  explicitRestResult: source.includes("relationVariantFold<Exclude<RouteConstraintArgument, { readonly kind: 'pattern' }>, 'values', RouteConstraintArgumentAst>"),
  patternBranchConsumesValue: source.includes('pattern.value.value'),
  noLegacyDescriptor: !source.includes('Parsed')
};
console.log(JSON.stringify({ checks, allPass: Object.values(checks).every(Boolean) }, null, 2));
if (!Object.values(checks).every(Boolean)) process.exit(1);
