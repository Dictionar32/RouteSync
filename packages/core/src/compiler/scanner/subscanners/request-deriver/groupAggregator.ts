/**
 * groupAggregator.ts
 *
 * Aggregates routes and resources into grouped RequestType descriptors.
 *
 * @module core/compiler/scanner/subscanners/request-deriver
 */

import { ParsedResource, ParsedRoute } from "../../../../types/route";
import { RequestType, ResponseData } from "../../../artifacts/RequestTypesArtifact";
import { SemanticType } from "../../../types/SemanticType";
import { TypeInterner } from "../../../types/TypeInterner";
import { toCamelCase, toPascalCase } from "../../../../utils/resource-naming";
import { ScannedRequestTypeDescriptor } from "../../descriptors/requestDescriptors";
import { convertRawToSemanticType } from "./rawTypeConverter";
import { extractRouteDomain } from "./domainExtractor";
import { deriveRouteAction } from "./actionDeriver";
import {
    deriveActionResponseData,
    deriveFallbackResponseData,
    extractResourceResponseFields
} from "./responseDeriver";

export interface DerivationContext {
    readonly resourceIndex: ReadonlyMap<string, ParsedResource>;
    readonly modelIndex: ReadonlyMap<string, any>;
    readonly interner: TypeInterner;
    readonly toSemanticType: (raw: any) => SemanticType;
}

export function createDerivationContext(
    resources: readonly ParsedResource[],
    models: readonly any[],
    interner: TypeInterner
): DerivationContext {
    const resourceIndex = new Map<string, ParsedResource>();
    for (const res of resources) {
        resourceIndex.set(res.name, res);
        resourceIndex.set(res.name.toLowerCase(), res);
        const bare = res.name.replace(/Resource$/, '').toLowerCase();
        resourceIndex.set(bare, res);
    }

    const modelIndex = new Map<string, any>();
    for (const m of models) {
        modelIndex.set(m.name, m);
        modelIndex.set(m.name.toLowerCase(), m);
    }

    const toSemanticType = (raw: any): SemanticType =>
        convertRawToSemanticType(raw, modelIndex, interner);

    return {
        resourceIndex,
        modelIndex,
        interner,
        toSemanticType
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
            rawDomain,
            ctx.toSemanticType
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

            let newRespData = existing.responseData;
            if (actionRespData && (!existing.responseData || !existing.responseData.fields || Object.keys(existing.responseData.fields).length === 0)) {
                newRespData = actionRespData;
            }

            groups.set(bareDomain, ScannedRequestTypeDescriptor.create({
                resourceName: existing.resourceName,
                formTypeName: existing.formTypeName,
                actions: newActions,
                responseData: newRespData
            }));
        } else {
            const respData: ResponseData | undefined = actionRespData ||
                deriveFallbackResponseData(rawDomain, bareDomain, ctx.resourceIndex, ctx.toSemanticType);

            groups.set(bareDomain, ScannedRequestTypeDescriptor.create({
                resourceName: toCamelCase(rawDomain),
                formTypeName: `${toPascalCase(rawDomain)}Form`,
                actions: isReadRouteWithoutFields ? [] : [actionObj],
                responseData: respData
            }));
        }
    }

    for (const res of resources) {
        const cleanKey = res.name.replace(/Resource$/, '').toLowerCase();
        const respFields = extractResourceResponseFields(res, ctx.toSemanticType);

        if (!groups.has(cleanKey)) {
            groups.set(cleanKey, ScannedRequestTypeDescriptor.create({
                resourceName: res.name,
                formTypeName: `${res.name}Form`,
                actions: [],
                responseData: {
                    resourceName: res.name,
                    fields: respFields,
                    collection: false,
                    wrapped: false
                }
            }));
        } else {
            const existing = groups.get(cleanKey)!;
            if (!existing.responseData || !existing.responseData.fields || Object.keys(existing.responseData.fields).length === 0) {
                groups.set(cleanKey, ScannedRequestTypeDescriptor.create({
                    resourceName: existing.resourceName,
                    formTypeName: existing.formTypeName,
                    actions: existing.actions,
                    responseData: {
                        resourceName: res.name,
                        fields: respFields,
                        collection: false,
                        wrapped: false
                    }
                }));
            }
        }
    }

    return Array.from(groups.values());
}
