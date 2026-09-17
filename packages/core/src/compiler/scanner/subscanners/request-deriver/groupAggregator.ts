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
import { toCamelCase, toPascalCase } from "../../../../utils/resource-naming";
import { ScannedRequestTypeDescriptor } from "../../descriptors/requestDescriptors";
import { extractRouteDomain } from "./domainExtractor";
import { deriveRouteAction } from "./actionDeriver";
import {
    deriveActionResponseData,
    extractResourceResponseFields
} from "./responseDeriver";

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
        resourceIndex.set(res.name, res);
        resourceIndex.set(res.name.toLowerCase(), res);
        const bare = res.name.replace(/Resource$/, '').toLowerCase();
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
        const { rawDomain, bareDomain } = extractRouteDomain(route);
        const { formActionName, actionObj, fields, isReadRouteWithoutFields } =
            deriveRouteAction(route, ctx.interner);

        const actionRespData = deriveActionResponseData(
            route,
            ctx.resourceIndex,
        );

        if (groups.has(bareDomain)) {
            const existing = groups.get(bareDomain)!;
            const newActions = [...existing.actions];
            const existingIdx = newActions.findIndex(a => a.name === formActionName);
            if (!isReadRouteWithoutFields) {
                if (existingIdx >= 0) {
                    if (fields.length > 0 || newActions[existingIdx].fields.length === 0) {
                        newActions[existingIdx] = actionObj;
                    }
                } else {
                    newActions.push(actionObj);
                }
            }

            let response = existing.response;
            if (actionRespData && (existing.response.kind === "none" || existing.response.value.contract.fields.length === 0)) {
                response = { kind: "data", value: actionRespData };
            }

            groups.set(bareDomain, ScannedRequestTypeDescriptor.create({
                resourceName: existing.resourceName,
                formTypeName: existing.formTypeName,
                actions: newActions,
                response: response
            }));
        } else {
            const respData = actionRespData;

            groups.set(bareDomain, ScannedRequestTypeDescriptor.create({
                resourceName: toCamelCase(rawDomain),
                formTypeName: `${toPascalCase(rawDomain)}Form`,
                actions: isReadRouteWithoutFields ? [] : [actionObj],
                response: respData
                    ? { kind: "data", value: respData }
                    : { kind: "none" }
            }));
        }
    }

    for (const res of resources) {
        const cleanKey = res.name.replace(/Resource$/, '').toLowerCase();
        const respFields = extractResourceResponseFields(res);

        if (!groups.has(cleanKey)) {
            groups.set(cleanKey, ScannedRequestTypeDescriptor.create({
                resourceName: res.name,
                formTypeName: `${res.name}Form`,
                actions: [],
                response: { kind: "data", value: {
                    resourceName: res.name,
                    fields: respFields,
                    collection: false,
                    wrapped: false
                } }
            }));
        } else {
            const existing = groups.get(cleanKey)!;
            if (existing.response.kind === "none" || existing.response.value.contract.fields.length === 0) {
                groups.set(cleanKey, ScannedRequestTypeDescriptor.create({
                    resourceName: existing.resourceName,
                    formTypeName: existing.formTypeName,
                    actions: existing.actions,
                    response: { kind: "data", value: {
                        resourceName: res.name,
                        fields: respFields,
                        collection: false,
                        wrapped: false
                    } }
                }));
            }
        }
    }

    return Array.from(groups.values());
}
