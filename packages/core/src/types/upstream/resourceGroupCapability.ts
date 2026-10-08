import type { RouteSemanticFlow } from '../domain/routes';
import type { CrudRole } from './routeExecutionVocabulary';
import { CRUD_ROLE_REGISTRY } from '../domain/crudRoles';

export type ResourceGroupShape = 'full_crud' | 'read_only_crud' | 'flexible_crud' | 'custom' | 'singleton';

export interface ResourceGroupCapabilityEvidence {
  readonly kind: 'resource_group_capability_evidence';
  readonly source: 'closed_route_capabilities';
  readonly routeCount: number;
  readonly roles: readonly CrudRole[];
  readonly hasItemRoute: boolean;
  readonly closed: true;
}

export interface ResourceGroupCapabilityContract {
  readonly kind: 'resource_group_capability';
  readonly groupName: string;
  readonly shape: ResourceGroupShape;
  readonly evidence: ResourceGroupCapabilityEvidence;
  readonly closed: true;
}

/**
 * Upstream group-shape authority. It composes already-closed route capabilities
 * into one group contract. Generators should consume this result, not infer a
 * resource shape from index/show/mutation slots.
 */
export function resourceGroupCapabilitiesFromRoutes(
  routes: readonly RouteSemanticFlow[],
): readonly ResourceGroupCapabilityContract[] {
  const groups = new Map<string, RouteSemanticFlow[]>();
  for (const route of routes) {
    const groupName = route.identity.domain.group.value.value;
    const group = groups.get(groupName) ?? [];
    group.push(route);
    groups.set(groupName, group);
  }

  const capabilities: ResourceGroupCapabilityContract[] = [];
  for (const [groupName, groupRoutes] of groups) {
    const roles = new Set(groupRoutes.map(route => route.capability.crudRole));
    const hasIndex = roles.has('index');
    const hasShow = roles.has('show');
    const hasCreate = roles.has('create');
    const hasUpdate = roles.has('update');
    const hasDelete = roles.has('delete');
    const hasItemRoute = groupRoutes.some(route => CRUD_ROLE_REGISTRY[route.capability.crudRole].affectsSingleResource);

    const shape: ResourceGroupShape = hasIndex && hasShow
      ? hasCreate && hasUpdate && hasDelete
        ? 'full_crud'
        : !hasCreate && !hasUpdate && !hasDelete
          ? 'read_only_crud'
          : 'flexible_crud'
      : hasItemRoute ? 'custom' : 'singleton';

    capabilities.push(Object.freeze({
      kind: 'resource_group_capability' as const,
      groupName,
      shape,
      evidence: Object.freeze({
        kind: 'resource_group_capability_evidence' as const,
        source: 'closed_route_capabilities' as const,
        routeCount: groupRoutes.length,
        roles: Object.freeze(Array.from(roles).sort()),
        hasItemRoute,
        closed: true as const,
      }),
      closed: true as const,
    }));
  }
  return Object.freeze(capabilities);
}
