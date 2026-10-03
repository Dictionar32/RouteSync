import type { RouteBindingContract, RouteBindingKey } from '../../../../types/upstream/routeBinding';
import { createColumnName } from '../../../../types/upstream/names';
import type { RouteBindingFact } from '../../../../types/upstream/routeBindingFacts';

/** AST-free semantic resolver for Laravel URI binding syntax. */
export function resolveRouteBindingFacts(facts: readonly RouteBindingFact[]): readonly RouteBindingContract[] {
  return Object.freeze(facts.map(fact => Object.freeze({
    parameter: fact.parameter,
    parent: fact.parent,
    key: resolveKey(fact.customKey),
    withTrashed: resolveWithTrashed(fact.withTrashed),
  })));
}

const KEY_BY_PRESENCE = Object.freeze({
  absent: () => ({ kind: 'default' as const }),
  present: (value: Extract<RouteBindingFact['customKey'], { kind: 'present' }>) => ({ kind: 'custom' as const, column: createColumnName(value.value.value) }),
});

function resolveKey(customKey: RouteBindingFact['customKey']): RouteBindingKey {
  return KEY_BY_PRESENCE[customKey.kind](customKey as never);
}

const TRASHED_BY_PRESENCE = Object.freeze({
  absent: () => ({ kind: 'disabled' as const }),
  present: () => ({ kind: 'enabled' as const }),
});

function resolveWithTrashed(fact: RouteBindingFact['withTrashed']): RouteBindingContract['withTrashed'] {
  return TRASHED_BY_PRESENCE[fact.kind]();
}
