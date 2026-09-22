/**
 * groupAggregator.ts
 *
 * Aggregates routes and resources into grouped RequestType descriptors.
 *
 * @module core/compiler/scanner/subscanners/request-deriver
 */

import { ParsedResource, ParsedRoute } from "../../../../types/route";
import { RequestType } from "../../../artifacts/RequestTypesArtifact";
import { TypeInterner } from "../../../types/TypeInterner";
import { ScannedRequestTypeDescriptor } from "../../descriptors/requestDescriptors";
import { extractRouteDomain } from "./domainExtractor";
import { deriveRouteAction } from "./actionDeriver";
import { deriveActionResponseData } from "./responseDeriver";

export interface DerivationContext {
    readonly resourceIndex: ReadonlyMap<string, ParsedResource>;
    readonly interner: TypeInterner;
}

export function createDerivationContext(
    resources: readonly ParsedResource[],
    interner: TypeInterner
): DerivationContext {
    const resourceIndex = new Map<string, ParsedResource>();
    for (const res of resources) {
        resourceIndex.set(res.name.value.value, res);
        resourceIndex.set(res.name.value.value.toLowerCase(), res);
        const bare = res.name.value.value.replace(/Resource$/, '').toLowerCase();
        resourceIndex.set(bare, res);
    }

    return {
        resourceIndex,
        interner
    };
}

export function aggregateRequestTypeGroups(
    routes: readonly ParsedRoute[],
    resources: readonly ParsedResource[],
    ctx: DerivationContext
): readonly RequestType[] {
    const groups = new Map<string, RequestType>();

    for (const route of routes) {
        const request = route.binding.request;
        if (request.kind === 'no_request') continue;

        const { formActionName, actionObj, fields } =
            deriveRouteAction(route);
        const actionRespData = deriveActionResponseData(route, ctx.resourceIndex);
        const groupKey = request.identity.resource.value.value.toLowerCase();
        const existing = groups.get(groupKey);

        if (existing === undefined) {
            groups.set(groupKey, ScannedRequestTypeDescriptor.create({
                identity: request.identity,
                source: request.source,
                actions: actionObj,
                response: actionRespData
                    ? { kind: 'data', value: actionRespData }
                    : { kind: 'none' }
            }));
            continue;
        }

        const newActions = [...existing.actions];
        if (formActionName.kind === 'some' && actionObj.length === 1) {
            const existingIdx = newActions.findIndex(action => action.name === formActionName.value);
            if (existingIdx >= 0) {
                if (fields.length > 0 || newActions[existingIdx].fields.length === 0) {
                    newActions[existingIdx] = actionObj[0];
                }
            } else {
                newActions.push(actionObj[0]);
            }
        }

        let response = existing.response;
        if (actionRespData && (response.kind === 'none' || response.value.contract.fields.length === 0)) {
            response = { kind: 'data', value: actionRespData };
        }

        groups.set(groupKey, ScannedRequestTypeDescriptor.create({
            identity: existing.identity,
            source: existing.source,
            actions: newActions,
            response
        }));
    }

    return Array.from(groups.values());
}
