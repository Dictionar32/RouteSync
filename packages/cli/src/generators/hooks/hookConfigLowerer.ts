/**
 * hookConfigLowerer.ts
 *
 * Lowers individual ResourceGroupDescriptor hook configurations and invalidation rules.
 *
 * @module cli/generators/hooks
 */

import { type ResourceGroupCapabilityContract, type ResourceGroupRouteReference, type ResourceGroupSlotDecision, type ResourceGroupDescriptor } from '@routesync/core';
import type { ClassifiedRoute } from '../route-capability-projection';

export function pushUnique(items: string[], item: string): void {
  if (!items.includes(item)) items.push(item);
}

export function addRouteInvalidations(route: ClassifiedRoute, invs: string[]): void {
  for (const expr of route.contract.invalidation.queryKeyExpressions) {
    pushUnique(invs, `          ${expr},`);
  }
}

export function* lowerGroupCacheLines(
  group: ResourceGroupDescriptor<ClassifiedRoute>,
  addInvs: (route: ClassifiedRoute, invs: string[]) => void
): Iterable<string> {
  yield* group.lowerCacheConfig(addInvs);
}

export function* lowerGroupHookConfig(
  group: ResourceGroupDescriptor<ClassifiedRoute>,
  addInvs: (route: ClassifiedRoute, invs: string[]) => void,
  capability: ResourceGroupCapabilityContract
): Iterable<string> {
  const { groupName } = group;
  yield `  ${groupName}: {`;
  yield `    types: {`;
  yield `      list: typeOf<${group.types.list}>(),`;
  yield `      detail: typeOf<${group.types.detail}>(),`;
  yield `      create: typeOf<${group.types.create}>(),`;
  yield `      update: typeOf<${group.types.update}>(),`;
  if (group.types.hasCustomError) {
    yield `      error: typeOf<${group.types.error}>(),`;
  }
  yield `    },`;
  yield ``;
  yield `    queryKey: QueryKey.${groupName},`;

  // Cache-operation identity is resolved upstream and transported in the
  // resource-group contract; projection only binds the reference to an endpoint.
  const routeByReference = (reference: ResourceGroupRouteReference): ClassifiedRoute => {
    const matches = group.all.filter(candidate => candidate.raw.identity.coordinates.name.value.value === reference.routeName);
    if (matches.length === 0) {
      throw new Error(`Upstream route contract references route not present in projected group: ${reference.routeName}`);
    }
    if (matches.length > 1) {
      throw new Error(`Upstream route contract identity is not unique in projected group: ${reference.routeName}`);
    }
    return matches[0];
  };
  const actionKeyLines = capability.routes.map(reference => {
    const route = routeByReference(reference);
    return `      ${reference.cacheOperationKey}: QueryKey.${groupName}.${route.actionName},`;
  });
  if (actionKeyLines.length > 0) {
    yield `    actionKeys: {`;
    for (const line of actionKeyLines) {
      yield line;
    }
    yield `    },`;
  }
  yield `    endpoint: api.${groupName},`;

  // Only project closed upstream slot decisions. No role/scope scan or semantic
  // reconstruction is allowed at this boundary.
  const routeForSlot = (slotName: string, slot: ResourceGroupSlotDecision): ClassifiedRoute | undefined => {
    if (slot.kind === 'absent') return undefined;
    if (slot.kind === 'ambiguous') {
      throw new Error(`Ambiguous upstream resource-group slot ${groupName}.${slotName}: ${slot.routeNames.join(', ')}`);
    }
    return routeByReference(slot.route);
  };
  const indexRoute = routeForSlot('index', capability.executionSlots.index);
  const showRoute = routeForSlot('show', capability.executionSlots.show);
  const createRoute = routeForSlot('create', capability.executionSlots.create);
  const updateRoute = routeForSlot('updateMember', capability.executionSlots.updateMember);
  const updateSelfRoute = routeForSlot('updateCollection', capability.executionSlots.updateCollection);
  const deleteRoute = routeForSlot('deleteMember', capability.executionSlots.deleteMember);
  const deleteSelfRoute = routeForSlot('deleteCollection', capability.executionSlots.deleteCollection);
  const endpointRef = (route: ClassifiedRoute | undefined): string => route ? `api.${groupName}.${route.actionName}` : 'undefined';
  const paramRef = (slot: ResourceGroupSlotDecision): string =>
    slot.kind === 'route' && slot.route.parameterKey ? JSON.stringify(slot.route.parameterKey) : 'undefined';
  yield `    crudSlots: {`;
  yield `      kind: 'crud_group_execution_contract',`;
  yield `      closed: true,`;
  yield `      indexService: ${endpointRef(indexRoute)},`;
  yield `      showService: ${endpointRef(showRoute)},`;
  yield `      createService: ${endpointRef(createRoute)},`;
  yield `      updateService: ${endpointRef(updateRoute)},`;
  yield `      updateSelfService: ${endpointRef(updateSelfRoute)},`;
  yield `      deleteService: ${endpointRef(deleteRoute)},`;
  yield `      deleteSelfService: ${endpointRef(deleteSelfRoute)},`;
  yield `      showParamKey: ${paramRef(capability.executionSlots.show)},`;
  yield `      updateParamKey: ${paramRef(capability.executionSlots.updateMember)},`;
  yield `      deleteParamKey: ${paramRef(capability.executionSlots.deleteMember)},`;
  yield `      customEndpoints: [`;
  for (const reference of capability.executionSlots.custom) {
    const route = routeByReference(reference);
    yield `        { action: ${JSON.stringify(reference.actionName)}, service: ${endpointRef(route)}, hookKind: '${reference.hookKind}', crudRole: 'custom' },`;
  }
  yield `      ],`;
  yield `    },`;

  const cacheLines = [...lowerGroupCacheLines(group, addInvs)];
  if (cacheLines.length > 0) {
    yield ``;
    yield `    cache: {`;
    for (const line of cacheLines) {
      yield line;
    }
    yield `    },`;
  }

  yield `  },`;
}
