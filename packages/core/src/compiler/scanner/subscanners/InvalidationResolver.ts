/**
 * InvalidationResolver.ts
 *
 * Resolves cache invalidations directly on routes at the Origin Boundary.
 *
 * @module core/compiler/scanner/subscanners/InvalidationResolver
 */

import {
    ParsedRoute,
    ResourceRouteGroup,
    RouteHookKind,
    InvalidationTarget,
    ScannedInvalidationTarget,
    ResourceResponseDescriptor,
    ModelResponseDescriptor,
    EloquentRelationType,
    ScannedRouteInvalidationPayload
} from "../../../types/route";
import type { ModelAst } from "../../../types/upstream/ast";
import type { ResourceName } from "../../../types/upstream/names";
import { ScannedRouteDescriptor } from "../descriptors/routeDescriptors";

function sequenceToArray<T>(items: import("../../../types/upstream/collections").Sequence<T>): T[] {
    const result: T[] = [];
    let current = items;
    while (current.kind === 'cons') {
        result.push(current.head);
        current = current.tail;
    }
    return result;
}

export class InvalidationResolver {
    public static resolveRouteInvalidations(
        routes: readonly ParsedRoute[],
        models: readonly ModelAst[],
        routeGroups: readonly ResourceRouteGroup[]
    ): readonly ParsedRoute[] {
        return routes.map(route => {
            switch (route.capability.hookKind) {
                case RouteHookKind.Query:
                case RouteHookKind.InfiniteQuery:
                    return route;

                case RouteHookKind.Mutation: {
                    const targets: InvalidationTarget[] = [];

                    // A. Self Invalidation (resource group rute sendiri)
                    targets.push(ScannedInvalidationTarget.selfList(route.identity.domain.resource));

                    // B. Traverse semantic relations from the already-resolved response model.
                    const responseAnalysis = route.contract.response.success.descriptor.toAnalysis(
                        route.identity.coordinates.name,
                        100
                    );
                    const responseModelName = responseAnalysis.kind === 'model'
                        ? responseAnalysis.modelName.value.value
                        : responseAnalysis.kind === 'resource'
                            ? responseAnalysis.resourceName.value.value
                            : undefined;
                    const matchedModel = responseModelName === undefined
                        ? undefined
                        : models.find(model => model.definition.identity.name.value.value === responseModelName);

                    if (matchedModel !== undefined) {
                        for (const rel of matchedModel.definition.relations.items.kind === 'empty' ? [] : sequenceToArray(matchedModel.definition.relations.items)) {
                            const sourceModel = matchedModel.definition.identity.name;
                            switch (rel.relation.kind) {
                                case 'belongs_to':
                                    targets.push(ScannedInvalidationTarget.parentList(sourceModel));
                                    targets.push(ScannedInvalidationTarget.parentDetail(sourceModel));
                                    break;
                                case 'has_many':
                                case 'has_one':
                                    targets.push(ScannedInvalidationTarget.resourceItem(sourceModel));
                                    break;
                                case 'belongs_to_many':
                                    targets.push(ScannedInvalidationTarget.resourceList(sourceModel));
                                    targets.push(ScannedInvalidationTarget.resourceItem(sourceModel));
                                    break;
                                default:
                                    break;
                            }
                        }
                    }

                    // C. Cascade / Parent Group Invalidation (0 if)
                    const normalizedGroup = route.identity.domain.resource.value.value.toLowerCase();
                    const matchedGroup = routeGroups.find(g => g.identity.resource.value.value.toLowerCase() === normalizedGroup);
                    switch (matchedGroup !== undefined) {
                        case true: {
                            const groupName = (matchedGroup as ResourceRouteGroup).identity.resource;
                            for (const g of routeGroups) {
                                const isChild = g.identity.resource.value.value.toLowerCase().startsWith(groupName.value.value.toLowerCase()) && g.identity.resource.value.value !== groupName.value.value;
                                switch (isChild) {
                                    case true:
                                        targets.push(ScannedInvalidationTarget.resourceList(g.identity.resource));
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
                    if (route.binding.operation.name.value.value === 'logout') {
                        const authGroups: ResourceName[] = [];
                        for (const r of routes) {
                            if (r.capability.auth) {
                                const resource = r.identity.domain.resource;
                                if (!authGroups.some(existing => existing.value.value === resource.value.value)) {
                                    authGroups.push(resource);
                                }
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
