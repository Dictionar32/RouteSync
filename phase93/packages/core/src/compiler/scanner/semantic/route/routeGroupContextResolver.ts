/**
 * Upstream composition boundary for route-group syntax.
 *
 * AST extraction is isolated in routeGroupAstAdapter. Laravel/domain
 * interpretation lives in the AST-free semantic resolver. This function is
 * intentionally only the upstream bridge; downstream never sees the AST.
 */
import type { RouteDeclarationAst } from '../../lexer/routeAst/routeDeclarationAst';
import type { RouteGroupContext } from '../../../../types/upstream/route';
import { extractRouteGroupFactsFromAst } from './routeGroupAstAdapter';
import { resolveRouteGroupFacts } from './routeGroupSemanticResolver';

export function resolveRouteGroupContext(declaration: RouteDeclarationAst): RouteGroupContext {
  return resolveRouteGroupFacts(extractRouteGroupFactsFromAst(declaration));
}
