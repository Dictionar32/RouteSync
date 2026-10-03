import { createActionName, createRouteName, createRouteParameterName, createMiddlewareName, createResourceName } from '../../../../types/upstream/names';
import type { RouteResourceContract, ResourceActionSelection, ResourceRouteAction } from '../../../../types/upstream/routeResource';
import type { RouteResourceFact, RouteResourceMiddlewareFact } from '../../../../types/upstream/routeResourceFacts';
import type { ResourceNesting, ResourceMiddlewareContract, ResourceMiddlewareExclusionContract, ResourceBindingBehavior, SingletonCreationBehavior, SingletonDestructionBehavior, ResourceRegistrationMode } from '../../../../types/upstream/routeResourceMode';
import type { ResourceActionProfile, ResourceSemanticModel } from '../../../../types/upstream/routeResourceModel';
import type { RouteMiddlewareScope } from '../../../../types/upstream/routeMiddleware';
import { RESOURCE_CAPABILITY_CATALOG, RESOURCE_CREATION_BY_MODE, RESOURCE_DESTRUCTION_BY_MODE } from './routeResourceCapabilityCatalog';

const action = (value: string) => createActionName(value);

const PROFILE = RESOURCE_CAPABILITY_CATALOG;

const SELECTION: ResourceSemanticModel['selection'] = Object.freeze({
  all: Object.freeze([]),
  only: (available, requested) => Object.freeze(available.filter(item => requested.some(value => value.value.value === item.value.value))),
  except: (available, requested) => Object.freeze(available.filter(item => !requested.some(value => value.value.value === item.value.value))),
});

const SCOPE = Object.freeze({
  all: () => ({ kind: 'all' as const }),
  only: (fact: Extract<RouteResourceMiddlewareFact, { scope: { kind: 'only' } }>) => ({ kind: 'only' as const, actions: Object.freeze(fact.scope.actions.map(value => createActionName(value.value))) }),
  except: (fact: Extract<RouteResourceMiddlewareFact, { scope: { kind: 'except' } }>) => ({ kind: 'except' as const, actions: Object.freeze(fact.scope.actions.map(value => createActionName(value.value))) }),
} satisfies Readonly<Record<RouteResourceMiddlewareFact['scope']['kind'], (fact: RouteResourceMiddlewareFact) => RouteMiddlewareScope>>);

function resolveResourceMiddleware(declarations: readonly RouteResourceMiddlewareFact[]): readonly ResourceMiddlewareContract[] {
  return Object.freeze(declarations.map(declaration => Object.freeze({
    middleware: Object.freeze(declaration.middleware.map(value => {
      const [name, ...parameterParts] = value.value.split(':');
      return Object.freeze({
        name: createMiddlewareName(name),
        parameters: Object.freeze(parameterParts.map(parameter => ({ kind: 'string_value' as const, value: parameter }))),
      });
    })),
    scope: SCOPE[declaration.scope.kind](declaration),
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
    only: () => SELECTION.only(profile.actions, selection.actions),
    except: () => SELECTION.except(profile.actions, selection.actions),
  });
  return Object.freeze(handlers[selection.kind]());
}

function resolveNesting(resource: RouteResourceFact['resource']): ResourceNesting {
  const segments = Object.freeze(resource.value.value.split('.').map(createResourceName));
  const relation = segments.length > 1
    ? { kind: 'nested' as const, segments, parent: Object.freeze(segments.slice(0, -1)), child: segments[segments.length - 1] }
    : { kind: 'flat' as const, segments };
  return relation;
}

function resolveWithTrashed(value: RouteResourceFact['withTrashed'], actions: readonly import('../../../../types/upstream/names').ActionName[], profile: ResourceActionProfile): RouteResourceContract['withTrashed'] {
  const handlers = Object.freeze({
    absent: () => ({ kind: 'none' as const }),
    present: (input: Extract<typeof value, { kind: 'present' }>) => {
      const selected = input.value.length === 0
        ? profile.withTrashedDefaults.filter(defaultAction => actions.some(actionName => actionName.value.value === defaultAction.value.value))
        : input.value.map(item => item.value);
      const resultKind = input.value.length === 0 ? 'default_actions' as const : 'selected_actions' as const;
      return { kind: resultKind, actions: Object.freeze(selected.map(createActionName)) };
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

function resolveCreation(mode: ResourceRegistrationMode, value: RouteResourceFact['creatable'], _profile: ResourceActionProfile): SingletonCreationBehavior {
  return RESOURCE_CREATION_BY_MODE[mode.kind][value.kind];
}

function resolveDestruction(mode: ResourceRegistrationMode, value: RouteResourceFact['destroyable'], _profile: ResourceActionProfile): SingletonDestructionBehavior {
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

/** Semantic model elevation. Laravel knowledge is materialized here; downstream flow only composes the result. */
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
    creation: resolveCreation(fact.method, fact.creatable, profile),
    destruction: resolveDestruction(fact.method, fact.destroyable, profile),
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
