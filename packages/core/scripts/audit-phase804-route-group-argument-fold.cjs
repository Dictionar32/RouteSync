const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const parser = fs.readFileSync(path.join(root, 'src/compiler/scanner/lexer/routeAst/routeDeclarationParser.ts'), 'utf8');
const semantic = fs.readFileSync(path.join(root, 'src/compiler/scanner/lexer/routeAst/semanticRouteSyntaxRelations.ts'), 'utf8');
const upstream = fs.readFileSync(path.join(root, 'src/types/upstream/routeConstraints.ts'), 'utf8');
const group = fs.readFileSync(path.join(root, 'src/types/upstream/routeGroupFacts.ts'), 'utf8');

const checks = {
  parserConsumesUpstreamConstraintArgument: /import type \{ RouteConstraintArgument \} from '\.\.\/\.\.\/\.\.\/\.\.\/types\/upstream\/routeConstraints';/.test(parser),
  parserUsesCanonicalVariantFoldArity: /relationVariantFold<RouteConstraintArgument, 'pattern', RouteConstraintArgumentAst>\(argument, 'pattern',/.test(parser) && /values => Object\.freeze\(\{ kind: 'values'/.test(parser),
  parserHasNoFiveArgumentVariantFold: !/relationVariantFold<[\s\S]*?\n\s*\}\),\n\s*pattern =>/.test(parser),
  groupFactUsesUpstreamRouteParameterName: /readonly parameter: RouteParameterName;/.test(group),
  groupFactUsesUpstreamConstraintArgument: /readonly argument: RouteConstraintArgument;/.test(group),
  semanticImportsUpstreamGroupFact: /import type \{ RouteGroupConstraintFact \} from '\.\.\/\.\.\/\.\.\/\.\.\/types\/upstream\/routeGroupFacts';/.test(semantic),
  semanticProducesGroupSource: /source: Object\.freeze\(\{ kind: 'group' \}\)/.test(semantic),
  upstreamConstraintArgumentClosedAdt: /export type RouteConstraintArgument =/.test(upstream) && /kind: 'pattern'/.test(upstream) && /kind: 'values'/.test(upstream) && /kind: 'none'/.test(upstream),
};

const allPass = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 804, checks, allPass }, null, 2));
process.exitCode = allPass ? 0 : 1;
