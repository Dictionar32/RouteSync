import type { ActionName } from '../../../../types/upstream/names';
import type { RouteMiddlewareScope } from '../../../../types/upstream/routeMiddleware';
import type { Presence } from '../../../../types/upstream/presence';

export const middlewareScopeApplicability = (
  scope: RouteMiddlewareScope,
  action: Presence<ActionName>,
): boolean => {
  const actionPresence = action;
  const actionKey = Object.freeze({
    absent: () => '',
    present: (value: Extract<typeof actionPresence, { kind: 'present' }>) => value.value.value.value,
  })[actionPresence.kind](actionPresence as never);
  const selected = Object.freeze({
    all: () => new Set<string>(),
    only: (value: Extract<RouteMiddlewareScope, { kind: 'only' }>) => new Set(value.actions.map(item => item.value.value)),
    except: (value: Extract<RouteMiddlewareScope, { kind: 'except' }>) => new Set(value.actions.map(item => item.value.value)),
  })[scope.kind](scope as never);
  const catalog = Object.freeze({
    all: Object.freeze({ absent: true, present: true }),
    only: Object.freeze({ absent: false, present: selected.has(actionKey) }),
    except: Object.freeze({ absent: false, present: !selected.has(actionKey) }),
  } as const);
  return catalog[scope.kind][actionPresence.kind];
};
