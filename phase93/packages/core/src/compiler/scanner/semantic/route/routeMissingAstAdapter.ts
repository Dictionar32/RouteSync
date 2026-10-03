import type { RouteDeclarationAst } from '../../lexer/routeAst/routeDeclarationAst';
import type { RouteMissingFact } from '../../../../types/upstream/routeMissingFacts';
import { fromBooleanFlag } from '../../../../types/upstream/presence';
export type { RouteMissingFact } from '../../../../types/upstream/routeMissingFacts';

export function extractRouteMissingFactFromAst(ast: Pick<RouteDeclarationAst, 'missingHandler'>): RouteMissingFact {
  const presence = fromBooleanFlag(ast.missingHandler);
  const handlers = Object.freeze({
    absent: () => ({ kind: 'absent' as const }),
    present: () => ({ kind: 'custom_handler' as const }),
  });
  return handlers[presence.kind]();
}

/** Compatibility bridge: AST access is intentionally isolated to this adapter. */
export const routeMissingFactFromAst = extractRouteMissingFactFromAst;
