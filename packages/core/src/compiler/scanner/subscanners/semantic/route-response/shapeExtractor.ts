/**
 * shapeExtractor.ts
 *
 * Extracts typeName, baseName, and rawFields from route response definitions.
 *
 * @module core/compiler/scanner/subscanners/semantic/route-response
 */

import type { InlineResponseDescriptor, ScannedRoute } from '../../../../../types/route';
import { toPascalCase } from '../../../../../utils/resource-naming';

export interface RouteResponseShape {
    readonly typeName: string;
    readonly baseName: string;
    readonly rawFields: readonly unknown[];
}

export function extractRouteResponseShape(route: ScannedRoute): RouteResponseShape | null {
    let typeName = '';
    let baseName = '';
    let rawFields: readonly unknown[] = [];

    if (route.response && route.response.kind === 'inline') {
        const inlineResp = route.response as InlineResponseDescriptor;
        typeName = inlineResp.typeName;
        baseName = inlineResp.baseName;
        const inlineFieldsUnknown = inlineResp.fields as unknown;
        rawFields = Array.isArray(inlineFieldsUnknown)
            ? (inlineFieldsUnknown as readonly unknown[])
            : Object.entries((inlineFieldsUnknown as Record<string, unknown>) || {});
    } else if (route.response && 'fields' in route.response) {
        const respObj = route.response as unknown as Record<string, unknown>;
        const rawDomain = route.domain
            ? route.domain
            : (route.resourceName
                ? route.resourceName
                : (route.actionName ? route.actionName.replace(/Controller$/, '') : 'Inline'));
        typeName = `${toPascalCase(rawDomain)}Transformed`;
        baseName = toPascalCase(rawDomain);
        const respFieldsUnknown = respObj.fields as unknown;
        rawFields = Array.isArray(respFieldsUnknown)
            ? (respFieldsUnknown as readonly unknown[])
            : Object.entries((respFieldsUnknown as Record<string, unknown>) || {});
    } else if (route.response && (route.response.kind === 'resource' || 'resourceName' in route.response)) {
        const respObj = route.response as unknown as Record<string, unknown>;
        const rawDomain = route.domain ? route.domain : (route.resourceName ? route.resourceName : '');
        if (rawDomain && !rawDomain.endsWith('Resource')) {
            const pascalDomain = toPascalCase(rawDomain);
            typeName = `${pascalDomain}Transformed`;
            baseName = pascalDomain;
            const resName = typeof respObj.resourceName === 'string' ? (respObj.resourceName as string) : undefined;
            const targetRes = resName ? `${toPascalCase(resName)}Transformed` : 'unknown';
            rawFields = [{
                name: 'data',
                kind: 'collection',
                elementType: { kind: 'reference', name: targetRes }
            }];
        }
    }

    if (typeName.length === 0) {
        return null;
    }

    return { typeName, baseName, rawFields };
}
