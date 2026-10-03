import { createActionName, createRouteName, createRouteParameterName, createMiddlewareName, createResourceName } from '../../../../types/upstream/names';
import type { RouteResourceContract, ResourceActionSelection } from '../../../../types/upstream/routeResource';
import type { RouteResourceFact, RouteResourceMiddlewareFact } from '../../../../types/upstream/routeResourceFacts';
import type { ResourceNesting, ResourceMiddlewareContract, ResourceMiddlewareExclusionContract, ResourceBindingBehavior, SingletonCreationBehavior, SingletonDestructionBehavior, ResourceRegistrationMode } from '../../../../types/upstream/routeResourceMode';
import type { ResourceActionProfile, ResourceSemanticModel } from '../../../../types/upstream/routeResourceModel';
import type { RouteMiddlewareScope } from '../../../../types/upstream/routeMiddleware';
import { cardinalityOf, fromOptional, type Presence } from '../../../../types/upstream/presence';
import { RESOURCE_CAPABILITY_CATALOG, RESOURCE_CREATION_BY_MODE, RESOURCE_DESTRUCTION_BY_MODE } from './routeResourceCapabilityCatalog';

const PROFILE = RESOURCE_CAPABILITY_CATALOG;

const actionKey = (value: { readonly value: { readonly value: string } }): string => value.value.value;

const SELECTION: ResourceSemanticModel['selection'] = Object.freeze({
  all: Object.freeze([]),
  only: (available, requested) => {
    const requestedKeys = new Set(requested.map(actionKey));
    return Object.freeze(available.filter(item => requestedKeys.has(actionKey(item))));
  },
  except: (available, requested) => {
    const requestedKeys = new Set(requested.map(actionKey));
    return Object.freeze(available.filter(item => !requestedKeys.has(actionKey(item))));
  },
});

const SCOPE = Object.freeze({
  all: () => ({ kind: 'all' as const }),
  only: (scope: Extract<RouteResourceMiddlewareFact['scope'], { kind: 'only' }>) => ({ kind: 'only' as const, actions: Object.freeze(scope.actions.map(value => createActionName(value.value))) }),
  except: (scope: Extract<RouteResourceMiddlewareFact['scope'], { kind: 'except' }>) => ({ kind: 'except' as const, actions: Object.freeze(scope.actions.map(value => createActionName(value.value))) }),
} satisfies Readonly<Record<RouteResourceMiddlewareFact['scope']['kind'], (scope: RouteResourceMiddlewareFact['scope']) => RouteMiddlewareScope>>);

function resolveResourceMiddleware(declarations: readonly RouteResourceMiddlewareFact[]): readonly ResourceMiddlewareContract[] {
  return Object.freeze(declarations.map(declaration => Object.freeze({
    middleware: Object.freeze(declaration.middleware.map(value => {
      const parts = value.value.split(':');
      const name = parts.shift();
      const namePresence = fromOptional(name);
      return Object.freeze({
        name: Object.freeze({
          absent: () => createMiddlewareName(value.value),
          present: (input: Extract<typeof namePresence, { kind: 'present' }>) => createMiddlewareName(input.value),
        })[namePresence.kind](namePresence as never),
        parameters: Object.freeze(parts.map(parameter => ({ kind: 'string_value' as const, value: parameter }))),
      });
    })),
    scope: SCOPE[declaration.scope.kind](declaration.scope as never),
  })));
}

function resolveResourceMiddlewareExclusions(declarations: readonly RouteResourceMiddlewareFact[]): readonly ResourceMiddlewareExclusionContract[] {
  return Object.freeze(resolveResourceMiddleware(declarations));
}

function resolveSelection(filter: RouteResourceFact['actionFilter']): ResourceActionSelection {
  const handlers = Object.freeze({
    absent: () => ({ kind: 'all' as const, actions: Object.freeze([]) }),
    present: (value: Extract<typeof filter, { kind: 'present' }>) => ({
      kind: value.value.kind,
      actions: Object.freeze(value.value.actions.map(item => createActionName(item.value))),
    }),
  });
  return handlers[filter.kind](filter as never);
}

function resolveActions(profile: ResourceActionProfile, selection: ResourceActionSelection): readonly import('../../../../types/upstream/names').ActionName[] {
  const handlers = Object.freeze({
    all: () => profile.actions,
    only: (value: Extract<ResourceActionSelection, { kind: 'only' }>) => SELECTION.only(profile.actions, value.actions),
    except: (value: Extract<ResourceActionSelection, { kind: 'except' }>) => SELECTION.except(profile.actions, value.actions),
  });
  return Object.freeze(handlers[selection.kind](selection as never));
}

function resolveNesting(resource: RouteResourceFact['resource']): ResourceNesting {
  const segments = Object.freeze(resource.value.value.split('.').map(createResourceName));
  type State = { readonly segments: readonly typeof segments[number][]; readonly parent: readonly typeof segments[number][]; readonly child: Presence<typeof segments[number]> };
  const handlers = Object.freeze({
    absent: (state: State, segment: typeof segments[number]): State => Object.freeze({
      segments: Object.freeze([...state.segments, segment]),
      parent: state.parent,
      child: { kind: 'present' as const, value: segment },
    }),
    present: (state: State, segment: typeof segments[number]): State => Object.freeze({
      segments: Object.freeze([...state.segments, segment]),
      parent: Object.freeze([...state.parent, (state.child as Extract<Presence<typeof segments[number]>, { kind: 'present' }>).value]),
      child: { kind: 'present' as const, value: segment },
    }),
  });
  const state = segments.reduce<State>(
    (current, segment) => handlers[current.child.kind](current, segment),
    Object.freeze({ segments: Object.freeze([]), parent: Object.freeze([]), child: { kind: 'absent' as const } }),
  );
  const result = Object.freeze({
    absent: () => Object.freeze({ kind: 'flat' as const, segments: state.segments }),
    present: () => Object.freeze({ kind: 'nested' as const, segments: state.segments, parent: state.parent, child: (state.child as Extract<Presence<typeof segments[number]>, { kind: 'present' }>).value }),
  });
  return result[state.child.kind]();
}

function resolveWithTrashed(value: RouteResourceFact['withTrashed'], actions: readonly import('../../../../types/upstream/names').ActionName[], profile: ResourceActionProfile): RouteResourceContract['withTrashed'] {
  const handlers = Object.freeze({
    absent: () => ({ kind: 'none' as const }),
    present: (input: Extract<typeof value, { kind: 'present' }>) => {
      const cardinality = cardinalityOf(input.value);
      const actionKeys = new Set(actions.map(actionKey));
      const requestedByCardinality = Object.freeze({
        empty: () => Object.freeze(profile.withTrashedDefaults.filter(defaultAction => actionKeys.has(actionKey(defaultAction)))),
        non_empty: () => Object.freeze(input.value.map(item => createActionName(item.value))),
      });
      const kindByCardinality = Object.freeze({ empty: 'default_actions' as const, non_empty: 'selected_actions' as const });
      return { kind: kindByCardinality[cardinality], actions: requestedByCardinality[cardinality]() };
    },
  });
  return handlers[value.kind](value as never);
}

function resolveBinding(value: RouteResourceFact['scoped']): ResourceBindingBehavior {
  const handlers = Object.freeze({
    absent: () => ({ kind: 'default' as const }),
    present: (input: Extract<typeof value, { kind: 'present' }>) => ({ kind: 'scoped' as const, parameters: Object.freeze(input.value.map(entry => ({ parameter: entry.parameter, key: entry.key }))) }),
  });
  return handlers[value.kind](value as never);
}

function resolveCreation(mode: ResourceRegistrationMode, value: RouteResourceFact['creatable']): SingletonCreationBehavior {
  return RESOURCE_CREATION_BY_MODE[mode.kind][value.kind];
}

function resolveDestruction(mode: ResourceRegistrationMode, value: RouteResourceFact['destroyable']): SingletonDestructionBehavior {
  return RESOURCE_DESTRUCTION_BY_MODE[mode.kind][value.kind];
}

function resolveRouteNames(fact: RouteResourceFact): RouteResourceContract['routeNames'] {
  const handlers = Object.freeze({
    absent: () => Object.freeze([] as RouteResourceContract['routeNames']),
    present: (input: Extract<typeof fact.names, { kind: 'present' }>) => Object.freeze(input.value.overrides.map(entry => Object.freeze({ action: createActionName(entry.action.value), name: createRouteName(entry.name.value) }))),
  });
  return handlers[fact.names.kind](fact.names as never);
}

function resolveParameters(fact: RouteResourceFact): RouteResourceContract['parameters'] {
  const handlers = Object.freeze({
    absent: () => Object.freeze([] as RouteResourceContract['parameters']),
    present: (input: Extract<typeof fact.parameters, { kind: 'present' }>) => Object.freeze(input.value.overrides.map(entry => Object.freeze({ resource: entry.resource, parameter: createRouteParameterName(entry.parameter.value) }))),
  });
  return handlers[fact.parameters.kind](fact.parameters as never);
}

function resolveNestingBehavior(value: RouteResourceFact['shallow']): import('../../../../types/upstream/routeResourceMode').ResourceNestingBehavior {
  const handlers = Object.freeze({
    absent: () => ({ kind: 'standard' as const }),
    present: () => ({ kind: 'shallow' as const }),
  });
  return handlers[value.kind]();
}

export function resolveRouteResourceFact(fact: RouteResourceFact): RouteResourceContract {
  const profile = PROFILE[fact.method.kind];
  const selection = resolveSelection(fact.actionFilter);
  const actions = resolveActions(profile, selection);
  const nesting = resolveNesting(fact.resource);
  const model: ResourceSemanticModel = Object.freeze({
    mode: fact.method,
    profile,
    nesting,
    nestingBehavior: resolveNestingBehavior(fact.shallow),
    binding: resolveBinding(fact.scoped),
    creation: resolveCreation(fact.method, fact.creatable),
    destruction: resolveDestruction(fact.method, fact.destroyable),
    actions,
    selection: SELECTION,
    routeNames: resolveRouteNames(fact),
    parameters: resolveParameters(fact),
    middleware: resolveResourceMiddleware(fact.middleware),
    middlewareExclusions: resolveResourceMiddlewareExclusions(fact.middlewareExclusions),
  });
  return Object.freeze({
    kind: 'route_resource_contract',
    resource: fact.resource,
    controller: fact.controller,
    actions: model.actions,
    selection,
    routeNames: model.routeNames,
    parameters: model.parameters,
    withTrashed: resolveWithTrashed(fact.withTrashed, model.actions, profile),
    registration: Object.freeze({
      mode: model.mode,
      nesting: model.nesting,
      nestingBehavior: model.nestingBehavior,
      binding: model.binding,
      creation: model.creation,
      destruction: model.destruction,
    }),
    middleware: model.middleware,
    middlewareExclusions: model.middlewareExclusions,
  });
}
