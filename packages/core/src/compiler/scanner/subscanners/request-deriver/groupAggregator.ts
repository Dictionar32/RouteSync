/**
 * groupAggregator.ts
 *
 * Aggregates routes and resources into grouped RequestType descriptors through
 * relation folding. Group existence, request lookup, action replacement and
 * response selection are semantic relations rather than host-language control
 * flow.
 */

import type { RouteSemanticFlow } from "../../../../types/route";
import type { ResourceAst, RequestAst } from "../../../../types/upstream/ast";
import type { RequestType } from "../../../artifacts/RequestTypesArtifact";
import { TypeInterner } from "../../../types/TypeInterner";
import { ScannedRequestTypeDescriptor } from "../../descriptors/requestDescriptors";
import { createSourceFile } from "../../../../types/upstream/names";
import { extractRouteDomain } from "./domainExtractor";
import { deriveRouteAction } from "./actionDeriver";
import { deriveActionResponseData } from "./responseDeriver";
import {
    relationAny,
    relationEqual,
    relationFirstOption,
    relationFold,
    relationGate,
    relationIndexOf,
    relationIndexAdd,
    relationIndexLookup,
    type RelationIndex,
    relationOptionFold,
    relationProject,
    relationSome,
    relationNone,
    type RelationOption,
} from "../../../../semantic/foundation/relationalSequence";

export interface DerivationContext {
    readonly resourceIndex: RelationIndex<string, ResourceAst>;
    readonly requestIndex: RelationIndex<string, RequestAst>;
    readonly interner: TypeInterner;
}

export function createDerivationContext(
    resources: readonly ResourceAst[],
    requests: readonly RequestAst[],
    interner: TypeInterner
): DerivationContext {
    const resourceIndex = relationFold(resources, Object.freeze([]) as RelationIndex<string, ResourceAst>, (index, res) => {
        const name = res.definition.name.value.value;
        return relationIndexAdd(
            relationIndexAdd(
                relationIndexAdd(index, name, res),
                name.toLowerCase(),
                res,
            ),
            name.replace(/Resource$/, '').toLowerCase(),
            res,
        );
    });

    const requestIndex = relationFold(requests, Object.freeze([]) as RelationIndex<string, RequestAst>, (index, request) => {
        const name = request.definition.identity.request.value.value;
        return relationIndexAdd(relationIndexAdd(index, name, request), name.toLowerCase(), request);
    });
    return { resourceIndex, requestIndex, interner };
}

const lookupRequest = (
    ctx: DerivationContext,
    requestName: string,
): RelationOption<RequestAst> => relationFirstOption(
    [requestName, requestName.toLowerCase()],
    name => relationOptionFold(relationIndexLookup(ctx.requestIndex, name), () => false, () => true),
);

const requestValue = (ctx: DerivationContext, requestName: string): RelationOption<RequestAst> => {
    const names = [requestName, requestName.toLowerCase()] as const;
    return relationOptionFold(
        relationFirstOption(names, name => ctx.requestIndex.has(name)),
        () => relationNone<RequestAst>(),
        name => relationIndexLookup(ctx.requestIndex, name),
    );
};

const buildDescriptor = (
    route: RouteSemanticFlow,
    requestAst: RequestAst,
    actionObj: ReturnType<typeof deriveRouteAction>["actionObj"],
    actionRespData: ReturnType<typeof deriveActionResponseData>,
): RequestType => relationOptionFold(
    actionRespData,
    () => ScannedRequestTypeDescriptor.create({
        identity: route.binding.request as Extract<typeof route.binding.request, { kind: 'request' }>,
        source: {
            identity: route.binding.request.identity.source,
            sourceFile: createSourceFile(requestAst.source.file.value.value),
            source: requestAst.source,
            authorization: relationGate(
                relationEqual(requestAst.definition.validation.authorization.kind, 'authorized'),
                () => ({ kind: 'authorized' as const }),
                () => ({ kind: 'denied' as const }),
            ),
            fields: [],
        },
        actions: actionObj,
        response: { kind: 'none' },
    }),
    value => ScannedRequestTypeDescriptor.create({
        identity: route.binding.request as Extract<typeof route.binding.request, { kind: 'request' }>,
        source: {
            identity: route.binding.request.identity.source,
            sourceFile: createSourceFile(requestAst.source.file.value.value),
            source: requestAst.source,
            authorization: relationGate(
                relationEqual(requestAst.definition.validation.authorization.kind, 'authorized'),
                () => ({ kind: 'authorized' as const }),
                () => ({ kind: 'denied' as const }),
            ),
            fields: [],
        },
        actions: actionObj,
        response: { kind: 'data', value },
    }),
);

const mergeGroup = (
    existing: RequestType,
    route: Extract<RouteSemanticFlow, { binding: { request: { kind: 'request' } } }>,
    requestAst: RequestAst,
    actionObj: ReturnType<typeof deriveRouteAction>["actionObj"],
    formActionName: ReturnType<typeof deriveRouteAction>["formActionName"],
    fields: ReturnType<typeof deriveRouteAction>["fields"],
    actionRespData: ReturnType<typeof deriveActionResponseData>,
): RequestType => {
    const nextActions = relationOptionFold(
        formActionName,
        () => existing.actions,
        name => {
            const actionIndex = relationIndexOf(existing.actions, action => relationEqual(action.name, name));
            return relationGate(
                relationEqual(actionObj.length, 1),
                () => relationGate(
                    actionIndex >= 0,
                    () => relationGate(
                        relationAny([fields.length > 0, relationEqual(existing.actions[actionIndex].fields.length, 0)]),
                        () => relationProject(existing.actions, (action, index) => relationGate(
                            relationEqual(index, actionIndex),
                            () => actionObj[0],
                            () => action,
                        )),
                        () => existing.actions,
                    ),
                    () => [...existing.actions, actionObj[0]],
                ),
                () => existing.actions,
            );
        },
    );

    const response = relationOptionFold(
        actionRespData,
        () => existing.response,
        value => relationGate(
            relationAny([
                relationEqual(existing.response.kind, 'none'),
                relationEqual(existing.response.value.contract.fields.length, 0),
            ]),
            () => ({ kind: 'data' as const, value }),
            () => existing.response,
        ),
    );

    return ScannedRequestTypeDescriptor.create({
        identity: existing.identity,
        source: existing.source,
        actions: nextActions,
        response,
    });
};

export function aggregateRequestTypeGroups(
    routes: readonly RouteSemanticFlow[],
    resources: readonly ResourceAst[],
    ctx: DerivationContext
): readonly RequestType[] {
    const groups = relationFold(routes, Object.freeze([]) as RelationIndex<string, RequestType>, (groupIndex, route) => {
        return relationGate(
            relationEqual(route.binding.request.kind, 'no_request'),
            () => groupIndex,
            () => {
                const request = route.binding.request as Extract<typeof route.binding.request, { kind: 'request' }>;
                return relationOptionFold(
                    requestValue(ctx, request.identity.source.requestClass.value.value),
                    () => groupIndex,
                    requestAst => {
                        const derived = deriveRouteAction(route);
                        const actionRespData = deriveActionResponseData(route, ctx.resourceIndex);
                        const groupKey = request.identity.resource.value.value.toLowerCase();
                        return relationGate(
                            relationOptionFold(relationIndexLookup(groupIndex, groupKey), () => false, () => true),
                            () => {
                                const existing = relationOptionFold(relationIndexLookup(groupIndex, groupKey), () => { throw Error(`Missing request group: ${groupKey}`); }, value => value);
                                return relationIndexAdd(groupIndex, groupKey, mergeGroup(existing, route as Extract<RouteSemanticFlow, { binding: { request: { kind: 'request' } } }>, requestAst, derived.actionObj, derived.formActionName, derived.fields, actionRespData));
                            },
                            () => {
                                return relationIndexAdd(groupIndex, groupKey, buildDescriptor(route, requestAst, derived.actionObj, actionRespData));
                            },
                        );
                    },
                );
            },
        );
    });

    return relationProject(groups, entry => entry[1]);
}
