/**
 * InvalidationResolver.ts
 *
 * Resolves cache invalidations directly on routes at the Origin Boundary.
 *
 * @module core/compiler/scanner/subscanners/InvalidationResolver
 */

import {
    ParsedRoute,
    ParsedModel,
    ResourceRouteGroup,
    RouteHookKind,
    InvalidationTarget,
    ScannedInvalidationTarget,
    ResourceResponseDescriptor,
    ModelResponseDescriptor,
    EloquentRelationType,
    ScannedRouteInvalidationPayload
} from "../../../types/route";
import { ScannedRouteDescriptor } from "../descriptors/routeDescriptors";

export class InvalidationResolver {
    public static resolveRouteInvalidations(
        routes: readonly ParsedRoute[],
        models: readonly ParsedModel[],
        routeGroups: readonly ResourceRouteGroup[]
    ): readonly ParsedRoute[] {
        return routes.map(route => {
            switch (route.hookKind) {
                case RouteHookKind.Query:
                case RouteHookKind.InfiniteQuery:
                    return route;

                case RouteHookKind.Mutation: {
                    const targets: InvalidationTarget[] = [];

                    // A. Self Invalidation (resource group rute sendiri)
                    targets.push(ScannedInvalidationTarget.selfList(route.groupName));

                    // B. Database Relations Traversal langsung pada models (0 new Map, 0 wrapper)
                    let responseModelName = '';
                    if (route.response instanceof ResourceResponseDescriptor) {
                        responseModelName = route.response.resourceName;
                    } else if (route.response instanceof ModelResponseDescriptor) {
                        responseModelName = route.response.modelName;
                    } else if ('resourceName' in route.response && typeof (route.response as { resourceName?: string }).resourceName === 'string') {
                        responseModelName = (route.response as { resourceName: string }).resourceName;
                    } else if ('modelName' in route.response && typeof (route.response as { modelName?: string }).modelName === 'string') {
                        responseModelName = (route.response as { modelName: string }).modelName;
                    }
                    const matchedModel = models.find(m => m.name === responseModelName);
                    switch (matchedModel !== undefined) {
                        case true:
                            for (const rel of (matchedModel as ParsedModel).relations) {
                                switch (rel.type) {
                                    case EloquentRelationType.BelongsTo: {
                                        targets.push(ScannedInvalidationTarget.parentList(rel.sourceModel.value));
                                        targets.push(ScannedInvalidationTarget.parentDetail(rel.sourceModel.value));
                                        break;
                                    }
                                    case EloquentRelationType.HasMany:
                                    case EloquentRelationType.HasOne: {
                                        targets.push(ScannedInvalidationTarget.resourceItem(rel.sourceModel.value));
                                        break;
                                    }
                                    case EloquentRelationType.BelongsToMany: {
                                        targets.push(ScannedInvalidationTarget.resourceList(rel.sourceModel.value));
                                        targets.push(ScannedInvalidationTarget.resourceItem(rel.sourceModel.value));
                                        break;
                                    }
                                }
                            }
                            break;
                        case false:
                            break;
                    }

                    // C. Cascade / Parent Group Invalidation (0 if)
                    const normalizedGroup = route.groupName.toLowerCase();
                    const matchedGroup = routeGroups.find(g => g.resourceName.toLowerCase() === normalizedGroup);
                    switch (matchedGroup !== undefined) {
                        case true: {
                            const groupNameStr = (matchedGroup as ResourceRouteGroup).resourceName;
                            for (const g of routeGroups) {
                                const isChild = g.resourceName.toLowerCase().startsWith(groupNameStr.toLowerCase()) && g.resourceName !== groupNameStr;
                                switch (isChild) {
                                    case true:
                                        targets.push(ScannedInvalidationTarget.resourceList(g.resourceName));
                                        break;
                                    case false:
                                        break;
                                }
                            }
                            break;
                        }
                        case false:
                            break;
                    }

                    // D. Auth / Logout Invalidation
                    if (route.actionName === 'logout' || route.path.includes('/logout')) {
                        const authGroups = new Set<string>();
                        for (const r of routes) {
                            if (r.auth && r.groupName) {
                                authGroups.add(r.groupName);
                            }
                        }
                        for (const grp of authGroups) {
                            targets.push(ScannedInvalidationTarget.authResource(grp));
                        }
                    }

                    // Complete Contract Invalidation Payload
                    const invalidation = new ScannedRouteInvalidationPayload({
                        targets: Object.freeze(targets)
                    });

                    switch (route instanceof ScannedRouteDescriptor) {
                        case true:
                            return (route as ScannedRouteDescriptor).withInvalidation(invalidation);
                        case false:
                            return Object.freeze({ ...route, invalidation });
                    }
                }
            }
        });
    }
}
