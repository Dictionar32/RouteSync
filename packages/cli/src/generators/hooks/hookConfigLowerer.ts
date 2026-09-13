/**
 * hookConfigLowerer.ts
 *
 * Lowers individual ResourceGroupDescriptor hook configurations and invalidation rules.
 *
 * @module cli/generators/hooks
 */

import { matchCrudRole, type ResourceGroupDescriptor } from '@routesync/core';
import type { ClassifiedRoute } from '../route-classifier';

export function pushUnique(items: string[], item: string): void {
  if (!items.includes(item)) items.push(item);
}

export function addRouteInvalidations(route: ClassifiedRoute, invs: string[]): void {
  for (const expr of route.contract.invalidation.queryKeyExpressions) {
    pushUnique(invs, `          ${expr},`);
  }
}

export function toNormalizedActionKey(route: ClassifiedRoute): string {
  return matchCrudRole(route.crudRole, {
    update: () => 'update',
    delete: () => 'remove',
    index: () => route.actionName,
    show: () => route.actionName,
    create: () => route.actionName,
    custom: () => route.actionName
  });
}

export function* lowerGroupCacheLines(
  group: ResourceGroupDescriptor<ClassifiedRoute>,
  addInvs: (route: ClassifiedRoute, invs: string[]) => void
): Iterable<string> {
  yield* group.lowerCacheConfig(addInvs);
}

export function* lowerGroupHookConfig(
  group: ResourceGroupDescriptor<ClassifiedRoute>,
  addInvs: (route: ClassifiedRoute, invs: string[]) => void
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

  const actionKeyLines = group.all.map(
    route => `      ${toNormalizedActionKey(route)}: QueryKey.${groupName}.${route.actionName},`
  );
  if (actionKeyLines.length > 0) {
    yield `    actionKeys: {`;
    for (const line of actionKeyLines) {
      yield line;
    }
    yield `    },`;
  }
  yield `    endpoint: api.${groupName},`;

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
