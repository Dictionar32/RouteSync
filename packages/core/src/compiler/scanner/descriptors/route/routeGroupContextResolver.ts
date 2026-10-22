/**
 * Upstream composition boundary for route-group syntax.
 * AST extraction is isolated in routeGroupAstAdapter. Laravel/domain
 * interpretation lives in the AST-free semantic resolver. Downstream never sees the AST.
 */
import type { RouteDeclarationAst } from '../../lexer/routeAst/routeDeclarationAst';
import type { RouteGroupFact } from '../../../../types/upstream/routeGroupFacts';
import type { RouteGroupContext } from '../../../../types/upstream/route';
import { extractRouteGroupFactsFromAst } from './routeGroupAstAdapter';
import { routeGroupSemanticResolver } from '../../upstream/route/routeGroupSemanticResolver';

export interface RouteGroupContextResolverInterface {
  readonly fromFact: (facts: RouteGroupFact) => RouteGroupContext;
  readonly fromDeclaration: (declaration: RouteDeclarationAst) => RouteGroupContext;
}

export const routeGroupContextResolver: RouteGroupContextResolverInterface = Object.freeze({
  fromFact: (facts: RouteGroupFact): RouteGroupContext => routeGroupSemanticResolver.resolveContext(facts),
  fromDeclaration: (declaration: RouteDeclarationAst): RouteGroupContext =>
    routeGroupSemanticResolver.resolveContext(extractRouteGroupFactsFromAst(declaration)),
});
