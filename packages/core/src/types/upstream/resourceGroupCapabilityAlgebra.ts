/**
 * Declarative algebra for composing closed route capabilities into resource-group capabilities.
 * Route slot selection is resolved here once; generators and runtime consume route identities.
 */
import type { RouteSemanticFlow } from '../domain/routes';
import { CRUD_ROLE_REGISTRY } from '../domain/crudRoles';
import type { CrudRole } from './routeExecutionVocabulary';
import type {
  ResourceGroupCapabilityAlgebraInterface,
  ResourceGroupCapabilityContract,
  ResourceGroupExecutionSlots,
  ResourceGroupRouteReference,
  ResourceGroupShape,
  ResourceGroupSlotDecision,
} from './resourceGroupCapability';
import {
  relationAll,
  relationEqual,
  relationIndexAdd,
  relationIndexLookup,
  relationOptionFold,
  relationFold,
  relationProject,
  relationResolve,
  relationUnique,
  type RelationIndex,
} from '../../semantic/relations/relationalSequence';
import { relationContains } from '../../semantic/relations/relationMembership';

type ResourceGroupState = Readonly<{
  readonly routeCount: number;
  readonly roles: readonly CrudRole[];
  readonly hasItemRoute: boolean;
  readonly routes: readonly RouteSemanticFlow[];
}>;
type ResourceGroupIndex = RelationIndex<string, ResourceGroupState>;

const accumulateRoute = (groups: ResourceGroupIndex, route: RouteSemanticFlow): ResourceGroupIndex => {
  const groupName = route.identity.domain.group.value.value;
  const role = route.capability.crudRole;
  const affectsSingleResource = CRUD_ROLE_REGISTRY[role].affectsSingleResource;
  return relationOptionFold(
    relationIndexLookup(groups, groupName),
    () => relationIndexAdd(groups, groupName, Object.freeze({
      routeCount: 1,
      roles: Object.freeze([role]),
      hasItemRoute: affectsSingleResource,
      routes: Object.freeze([route]),
    })),
    current => {
      const updated: ResourceGroupState = Object.freeze({
        routeCount: current.routeCount + 1,
        roles: relationUnique([...current.roles, role]),
        hasItemRoute: relationResolve(
          relationEqual(current.hasItemRoute, true),
          () => true,
          () => affectsSingleResource,
        ),
        routes: Object.freeze([...current.routes, route]),
      });
      return relationProject(groups, entry => relationResolve(
        relationEqual(entry[0], groupName),
        () => Object.freeze([groupName, updated] as const),
        () => entry,
      ));
    },
  );
};

const shapeFromState = (state: ResourceGroupState): ResourceGroupShape => {
  const hasIndex = relationContains(state.roles, 'index');
  const hasShow = relationContains(state.roles, 'show');
  const hasCreate = relationContains(state.roles, 'create');
  const hasUpdate = relationContains(state.roles, 'update');
  const hasDelete = relationContains(state.roles, 'delete');
  return relationResolve(
    relationAll([hasIndex, hasShow]),
    () => relationResolve(
      relationAll([hasCreate, hasUpdate, hasDelete]),
      () => 'full_crud' as const,
      () => relationResolve(
        relationAll([relationEqual(hasCreate, false), relationEqual(hasUpdate, false), relationEqual(hasDelete, false)]),
        () => 'read_only_crud' as const,
        () => 'flexible_crud' as const,
      ),
    ),
    () => relationResolve(state.hasItemRoute, () => 'custom' as const, () => 'singleton' as const),
  );
};

const routeReference = (route: RouteSemanticFlow): ResourceGroupRouteReference => {
  const parameter = route.identity.parameters.path[0];
  return Object.freeze({
    kind: 'resource_group_route_reference',
    routeName: route.identity.coordinates.name.value.value,
    actionName: route.capability.actionName.value.value,
    cacheOperationKey: relationResolve(
      relationEqual(route.capability.crudRole, 'update'),
      () => 'update',
      () => relationResolve(
        relationEqual(route.capability.crudRole, 'delete'),
        () => 'remove',
        () => route.capability.actionName.value.value,
      ),
    ),
    hookKind: route.capability.hookKind,
    ...(parameter ? { parameterKey: parameter.name.value.value } : {}),
    targetScope: parameter ? 'member' as const : 'collection' as const,
    closed: true,
  });
};

const routeNamesFromRoutes = (routes: readonly RouteSemanticFlow[]): readonly string[] =>
  relationFold<RouteSemanticFlow, readonly string[]>(routes, Object.freeze([]), (names, route) =>
    Object.freeze([...names, route.identity.coordinates.name.value.value]),
  );

const decision = (routes: readonly RouteSemanticFlow[]): ResourceGroupSlotDecision => {
  if (routes.length === 0) return Object.freeze({ kind: 'absent', closed: true });
  if (routes.length > 1) return Object.freeze({
    kind: 'ambiguous',
    routeNames: Object.freeze([...routeNamesFromRoutes(routes)].sort()),
    closed: true,
  });
  return Object.freeze({ kind: 'route', route: routeReference(routes[0]), closed: true });
};

const slotRoutes = (routes: readonly RouteSemanticFlow[], role: CrudRole, scope?: 'collection' | 'member'): readonly RouteSemanticFlow[] =>
  relationFold<RouteSemanticFlow, readonly RouteSemanticFlow[]>(routes, Object.freeze([]), (selected, route) =>
    relationResolve(
      relationAll([
        relationEqual(route.capability.crudRole, role),
        scope === undefined || relationEqual(route.identity.parameters.path.length > 0 ? 'member' : 'collection', scope),
      ]),
      () => Object.freeze([...selected, route]),
      () => selected,
    ),
  );

const customRoutes = (routes: readonly RouteSemanticFlow[]): readonly ResourceGroupRouteReference[] =>
  relationFold<RouteSemanticFlow, readonly ResourceGroupRouteReference[]>(routes, Object.freeze([]), (selected, route) =>
    relationResolve(
      relationEqual(route.capability.crudRole, 'custom'),
      () => Object.freeze([...selected, routeReference(route)]),
      () => selected,
    ),
  );

const slotsFromRoutes = (routes: readonly RouteSemanticFlow[]): ResourceGroupExecutionSlots => Object.freeze({
  index: decision(slotRoutes(routes, 'index')),
  show: decision(slotRoutes(routes, 'show')),
  create: decision(slotRoutes(routes, 'create')),
  updateMember: decision(slotRoutes(routes, 'update', 'member')),
  updateCollection: decision(slotRoutes(routes, 'update', 'collection')),
  deleteMember: decision(slotRoutes(routes, 'delete', 'member')),
  deleteCollection: decision(slotRoutes(routes, 'delete', 'collection')),
  custom: customRoutes(routes),
  closed: true,
});

const capabilityFromEntry = ([groupName, state]: readonly [string, ResourceGroupState]): ResourceGroupCapabilityContract => Object.freeze({
  kind: 'resource_group_capability',
  groupName,
  shape: shapeFromState(state),
  evidence: Object.freeze({
    kind: 'resource_group_capability_evidence',
    source: 'closed_route_capabilities',
    routeCount: state.routeCount,
    roles: Object.freeze([...state.roles].sort()),
    hasItemRoute: state.hasItemRoute,
    closed: true,
  }),
  routes: Object.freeze(relationProject(state.routes, routeReference)),
  executionSlots: slotsFromRoutes(state.routes),
  closed: true,
});

export const resourceGroupCapabilityAlgebra: ResourceGroupCapabilityAlgebraInterface = Object.freeze({
  compose: (routes: readonly RouteSemanticFlow[]): readonly ResourceGroupCapabilityContract[] =>
    relationProject(
      relationFold<RouteSemanticFlow, ResourceGroupIndex>(routes, Object.freeze([]), accumulateRoute),
      capabilityFromEntry,
    ),
});
