const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const parser = read('src/compiler/scanner/lexer/routeAst/routeDeclarationParser.ts');
const syntax = read('src/compiler/scanner/lexer/routeAst/semanticRouteSyntaxRelations.ts');
const facts = read('src/types/upstream/routeGroupFacts.ts');
const adapter = read('src/compiler/scanner/descriptors/route/routeGroupAstAdapter.ts');
const resolver = read('src/compiler/scanner/upstream/route/routeGroupSemanticResolver.ts');

const checks = {
  upstreamGroupConstraintOwnsTypedParameter: facts.includes('readonly parameter: RouteParameterName;'),
  upstreamGroupConstraintOwnsConstraintMethod: facts.includes('readonly method: RouteConstraintSyntaxMethod;'),
  upstreamGroupConstraintOwnsConstraintArgument: facts.includes('readonly argument: RouteConstraintArgument;'),
  upstreamGroupConstraintOwnsGroupProvenance: facts.includes("readonly source: { readonly kind: 'group' };"),
  syntaxStateUsesUpstreamGroupConstraint: syntax.includes("import type { RouteGroupConstraintFact } from '../../../../types/upstream/routeGroupFacts';"),
  syntaxNoLocalGroupConstraintDuplicate: !/export interface RouteGroupConstraintFact/.test(syntax),
  syntaxConvertsAstConstraintToUpstreamFact: syntax.includes('createRouteParameterName(fact.parameter)') && syntax.includes('groupConstraintArgument(fact.argument)'),
  parserConsumesUpstreamParameter: parser.includes('createRouteConstraintParameterAst(item.parameter.value.value)'),
  parserConsumesUpstreamArgument: parser.includes('groupConstraintArgumentAst(item.argument)'),
  adapterProducesCanonicalGroupFact: adapter.includes("source: Object.freeze({ kind: 'group' })"),
  adapterPreservesMethod: adapter.includes('method: constraint.method'),
  adapterPreservesArgument: adapter.includes('routeConstraintArgumentFact(constraint.argument)'),
  resolverNoFreeConstraintValue: !resolver.includes('constraint.value'),
  resolverProjectsConstraintAdt: resolver.includes('routeConstraintFromArgument(constraint.parameter, constraint.argument)'),
};

const allPass = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ phase: 803, checks, allPass }, null, 2));
process.exit(allPass ? 0 : 1);
