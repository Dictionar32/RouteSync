import type { RouteDeclarationAst } from '../../lexer/routeAst/routeDeclarationAst';
import type { RouteMissingFact } from '../../../../types/upstream/routeMissingFacts';
export type { RouteMissingFact } from '../../../../types/upstream/routeMissingFacts';

export function extractRouteMissingFactFromAst(ast: Pick<RouteDeclarationAst, 'missingHandler'>): RouteMissingFact {
  if (ast.missingHandler) return { kind: 'custom_handler' };
  return { kind: 'absent' };
}

/** Compatibility bridge: AST access is intentionally isolated to this adapter. */
export const routeMissingFactFromAst = extractRouteMissingFactFromAst;
