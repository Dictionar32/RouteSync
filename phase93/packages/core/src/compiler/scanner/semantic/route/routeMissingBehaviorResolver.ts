import type { RouteDeclarationAst } from '../../lexer/routeAst/routeDeclarationAst';
import type { RouteMissingBehaviorFlow } from '../../../../types/upstream/routeMissing';
import { extractRouteMissingFactFromAst } from './routeMissingAstAdapter';
import { resolveRouteMissingFact } from './routeMissingSemanticResolver';

/** Upstream bridge only: AST extraction is delegated to the adapter. */
export function resolveRouteMissingBehavior(
  ast: Pick<RouteDeclarationAst, 'missingHandler'>,
): RouteMissingBehaviorFlow {
  return resolveRouteMissingFact(extractRouteMissingFactFromAst(ast));
}
