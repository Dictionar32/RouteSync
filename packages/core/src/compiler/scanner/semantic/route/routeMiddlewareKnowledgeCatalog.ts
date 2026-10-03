import type { ActionName, MiddlewareName } from '../../../../types/upstream/names';
import type { RouteMiddlewareScope } from '../../../../types/upstream/routeMiddleware';
import type { Presence } from '../../../../types/upstream/presence';
import { relationAll, relationAny, relationEqual, relationNotEqual } from '../../../../semantic/kernel/semanticRelations';
import { relationGate, relationProject, relationSelect, relationVariantValue } from '../../../../semantic/kernel/relationalSequence';

export const middlewareScopeApplicability = (
  scope: RouteMiddlewareScope,
  action: Presence<ActionName>,
): boolean => {
  const actionKey = relationGate(
    relationEqual(action.kind, 'present'),
    () => action.value.value.value,
    () => '',
  );
  const actions = relationGate(
    relationEqual(scope.kind, 'all'),
    () => [] as readonly ActionName[],
    () => relationProject(relationVariantValue(scope, 'only').actions, item => item),
  );
  const contains = relationAny(relationProject(actions, item => relationEqual(item.value.value, actionKey)));
  return relationGate(relationEqual(scope.kind, 'all'),
    () => true,
    () => relationGate(relationEqual(scope.kind, 'only'),
      () => relationAll([relationEqual(action.kind, 'present'), contains]),
      () => relationAll([relationEqual(action.kind, 'present'), relationNotEqual(contains, true)])));
};


export type RouteAuthorizationKnowledge =
  | { readonly kind: 'authorized'; readonly middleware: readonly MiddlewareName[] }
  | { readonly kind: 'unauthorized'; readonly middleware: readonly MiddlewareName[] };

/** Laravel authorization knowledge derived from middleware identity; callers consume the fact, not the string convention. */
export function routeAuthorizationKnowledge(middlewares: readonly MiddlewareName[]): RouteAuthorizationKnowledge {
  const authorization = Object.freeze(relationProject(
    relationSelect(middlewares, middleware => middleware.value.value.startsWith('auth')),
    middleware => middleware,
  ));
  return relationGate(relationEqual(authorization.length, 0),
    () => ({ kind: 'unauthorized' as const, middleware: authorization }),
    () => ({ kind: 'authorized' as const, middleware: authorization }));
}
