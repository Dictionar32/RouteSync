/**
 * @file ResponseResolver.ts
 * @description Sub-domain for response type aliasing, route resolution, and group response counting
 *
 * @module cli/generators/semantic/ResponseResolver
 */

import { toTypeName } from '../names';
import type { CompilerIR, ResolvedResponse } from './semanticTypes';
import {
    resolveCanonicalAction,
    type SemanticResolutionContext
} from './SemanticResolutionContext';
import { ResourceFieldResolver } from './ResourceFieldResolver';

export class ResponseResolver {
    public static resolveResponseTypes(
        context: SemanticResolutionContext,
        ir: CompilerIR
    ): void {
        const seen = new Set<string>();

        for (const route of context.routes) {
            const responseId = `${route.name}Response`;

            if (seen.has(responseId)) {
                continue;
            }
            seen.add(responseId);

            try {
                const resolved = this.resolveResponse(route, ir);
                ir.responseTypes.set(responseId, resolved);
                ir.resourceAliases.set(route.name, resolved.name);
            } catch (error) {
                ir.metadata.errors.push(
                    `Failed to resolve response for route ${route.name}: ${error}`
                );
            }
        }
    }

    public static resolveResponse(
        route: any,
        ir: CompilerIR
    ): ResolvedResponse {
        const meta = route.response && typeof route.response === 'object' ? route.response : {};
        const name = this.resolveResponseName(route, meta);
        const actionName = resolveCanonicalAction(route.method);
        const isCollection = meta.kind === 'array' || meta.collection === true;
        const isPaginated = meta.paginated === true;
        const isWrapped = meta.wrapped === true;
        const isNullable = meta.nullable === true;

        return {
            id: `${route.name}Response`,
            kind: this.deriveResponseKind(meta),
            name,
            contractName: `${name}Schema`,
            mapperName: `to${name}Read`,
            formMapperName: `toApi${name}${actionName}`,
            fields: ResourceFieldResolver.buildFieldMap(meta),
            isCollection,
            isPaginated,
            isWrapped,
            isNullable,
        };
    }

    public static resolveResponseName(route: any, meta: any): string {
        const routeBaseName = typeof route.name === 'string' && route.name.length > 0 ? route.name : 'Response';

        if (!meta || !Object.keys(meta).length) {
            return `${toTypeName(routeBaseName)}Response`;
        }

        if (meta.kind === 'array' && meta.element) {
            return this.resolveResponseName(route, meta.element);
        }

        if (meta.resource && !meta.fields) {
            return toTypeName(meta.resource);
        }

        if (meta.model && !meta.fields) {
            return toTypeName(meta.model);
        }

        const actionName = resolveCanonicalAction(route.method);
        return `${toTypeName(routeBaseName)}${actionName}Response`;
    }

    public static deriveResponseKind(meta: any): 'primitive' | 'resource' | 'model' | 'custom' {
        if (!meta) return 'primitive';
        if (meta.resource) return 'resource';
        if (meta.model) return 'model';
        return 'custom';
    }

    public static resolveRoutes(
        context: SemanticResolutionContext,
        ir: CompilerIR
    ): void {
        for (const route of context.routes) {
            const action = resolveCanonicalAction(route.method);
            const responseId = `${route.name}Response`;
            const resp = route.response;
            const isCollection = resp && typeof resp === 'object' && (resp.kind === 'array' || resp.collection === true);
            const isPaginated = resp && typeof resp === 'object' && resp.paginated === true;
            const isWrapped = resp && typeof resp === 'object' && resp.wrapped === true;

            ir.resolvedRoutes.push({
                name: route.name,
                action,
                responseId,
                isCollection: Boolean(isCollection),
                isPaginated: Boolean(isPaginated),
                isWrapped: Boolean(isWrapped),
            });
        }
    }

    public static countResponsesByGroup(
        context: SemanticResolutionContext,
        ir: CompilerIR
    ): void {
        for (const route of context.routes) {
            const groupName = this.deriveGroupName(route);
            const existingCount = ir.responseCountByGroup.get(groupName);
            const currentCount = existingCount !== undefined ? existingCount : 0;
            ir.responseCountByGroup.set(groupName, currentCount + 1);
        }
    }

    public static deriveGroupName(route: any): string {
        if (route.groupName) return route.groupName;
        if (route.resource) return route.resource.toLowerCase();
        return 'default';
    }
}
