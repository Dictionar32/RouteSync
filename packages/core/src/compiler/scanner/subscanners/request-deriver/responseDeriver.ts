/**
 * responseDeriver.ts
 *
 * Derives ResponseData payloads from routes and resources.
 *
 * @module core/compiler/scanner/subscanners/request-deriver
 */

import { ParsedResource, ParsedRoute } from "../../../../types/route";
import { ResponseData } from "../../../artifacts/RequestTypesArtifact";
import { SemanticType } from "../../../types/SemanticType";

export function deriveActionResponseData(
    route: ParsedRoute,
    resourceIndex: ReadonlyMap<string, ParsedResource>,
    rawDomain: string,
    toSemanticType: (raw: any) => SemanticType
): ResponseData | undefined {
    if (!route.response) {
        return undefined;
    }

    const respFields: Record<string, SemanticType> = {};
    const resName = (route.response as any)?.resourceName || (route.response as any)?.resource;

    if (route.response.kind === 'resource' && resName) {
        const foundRes = resourceIndex.get(resName) || resourceIndex.get(resName.toLowerCase());
        if (foundRes && foundRes.fields) {
            const rawFields = Array.isArray(foundRes.fields)
                ? Object.fromEntries(foundRes.fields.map(f => [f.name, f.expression ?? f]))
                : foundRes.fields;
            for (const [k, v] of Object.entries(rawFields)) {
                respFields[k] = toSemanticType(v);
            }
        }
    } else if ('fields' in route.response) {
        const rawFields = Array.isArray((route.response as any).fields)
            ? Object.fromEntries(((route.response as any).fields as any[]).map(f => [f.name, f.expression ?? f]))
            : (route.response as any).fields;
        for (const [k, v] of Object.entries(rawFields || {})) {
            respFields[k] = toSemanticType(v);
        }
    }

    const defaultResName = resName || rawDomain;

    return {
        resourceName: defaultResName,
        fields: respFields,
        collection: 'collection' in route.response ? !!(route.response as any).collection : false,
        wrapped: 'wrapped' in route.response ? !!(route.response as any).wrapped : false
    };
}

export function deriveFallbackResponseData(
    rawDomain: string,
    bareDomain: string,
    resourceIndex: ReadonlyMap<string, ParsedResource>,
    toSemanticType: (raw: any) => SemanticType
): ResponseData | undefined {
    const foundRes = resourceIndex.get(rawDomain) || resourceIndex.get(bareDomain);
    if (!foundRes || !foundRes.fields) {
        return undefined;
    }

    const respFields: Record<string, SemanticType> = {};
    const rawFields = Array.isArray(foundRes.fields)
        ? Object.fromEntries(foundRes.fields.map(f => [f.name, f.expression ?? f]))
        : foundRes.fields;
    for (const [k, v] of Object.entries(rawFields)) {
        respFields[k] = toSemanticType(v);
    }

    return {
        resourceName: `${rawDomain}Resource`,
        fields: respFields,
        collection: false,
        wrapped: false
    };
}

export function extractResourceResponseFields(
    res: ParsedResource,
    toSemanticType: (raw: any) => SemanticType
): Record<string, SemanticType> {
    const respFields: Record<string, SemanticType> = {};
    const rawFields = Array.isArray(res.fields)
        ? Object.fromEntries(res.fields.map(f => [f.name, f.expression ?? f]))
        : (res.fields || {});
    for (const [k, v] of Object.entries(rawFields)) {
        respFields[k] = toSemanticType(v);
    }
    return respFields;
}
