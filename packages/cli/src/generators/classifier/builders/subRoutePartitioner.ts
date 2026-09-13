/**
 * subRoutePartitioner.ts
 *
 * Partitions classified routes into extra mutations and custom queries.
 *
 * @module cli/generators/classifier/builders
 */

import type { ClassifiedRoute } from '../classifierTypes';

export interface ErrorResolutionResult {
  readonly errorUnionType: string;
  readonly errorTypes: readonly string[];
  readonly hasCustomError: boolean;
}

export function partitionGroupSubRoutes(
  allRoutes: readonly ClassifiedRoute[],
  standardActionKeys: readonly string[],
  isCrud: boolean
): { readonly extraMutations: readonly ClassifiedRoute[]; readonly customQueries: readonly ClassifiedRoute[] } {
  const extraMutations: ClassifiedRoute[] = [];
  const customQueries: ClassifiedRoute[] = [];

  for (const route of allRoutes) {
    if (route.method === 'GET') {
      const hasKey = !isCrud || route.crudRole === 'custom';
      if (hasKey) customQueries.push(route);
    } else {
      const actionKey = route.actionName.toLowerCase();
      if (!standardActionKeys.includes(actionKey)) {
        extraMutations.push(route);
      }
    }
  }

  return {
    extraMutations: Object.freeze(extraMutations),
    customQueries: Object.freeze(customQueries)
  };
}
