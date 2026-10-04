const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const parser = fs.readFileSync(path.join(root, 'src/compiler/scanner/lexer/routeAst/routeDeclarationParser.ts'), 'utf8');
const upstream = fs.readFileSync(path.join(root, 'src/types/upstream/routeConstraints.ts'), 'utf8');
const checks = {
  parserConsumesUpstreamArgument: parser.includes("import type { RouteConstraintArgument } from '../../../../types/upstream/routeConstraints';"),
  parserUsesCanonicalVariantFold: parser.includes('relationVariantFold(argument, \'pattern\''),
  parserUsesFourArgumentFold: !parser.includes("relationVariantFold<RouteConstraintArgument, 'pattern', RouteConstraintArgumentAst>("),
  parserHasNoDeadPatternParameter: parser.includes('pattern => Object.freeze({'),
  upstreamArgumentClosedAdt: upstream.includes("kind: 'pattern'") && upstream.includes("kind: 'values'") && upstream.includes("kind: 'none'"),
};
console.log(JSON.stringify({ checks, allPass: Object.values(checks).every(Boolean) }, null, 2));
if (!Object.values(checks).every(Boolean)) process.exit(1);
