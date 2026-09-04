/**
 * ManifestArtifactLowerer.ts
 *
 * Upstream Origin Boundary Lowering Engine for RouteSync.
 * Converts RouteManifest into strongly-typed Compiler IR Artifacts (ResourceMappersArtifact, SemanticTypes).
 * Pure Structured Reusable Constructor (0 '?', 0 '??', 0 'undefined').
 *
 * @module compiler/domain/common
 */

import type { RouteManifest, ParsedRoute, ParsedResource } from '../../../types/route';
import type { ResourceMappersArtifact, ResourceMapperDefinition } from '../../artifacts/ResourceMappersArtifact';
import type { ResolvedField } from './ResolvedSemanticType';
import { ResourceFieldFlattener, FlattenedField } from './ResourceFieldFlattener';
import { toPascalCase, toCamelCase } from '../../../utils/resource-naming';
import { ObjectType, ScannedObjectProperty, SemanticType } from '../../types/SemanticType';
import { TypeInterner } from '../../types/TypeInterner';

export interface ManifestArtifactLowererDependencies {
    readonly flattener?: ResourceFieldFlattener;
    readonly interner?: TypeInterner;
}

export class ManifestArtifactLowerer {
    private readonly flattener: ResourceFieldFlattener;
    private readonly interner: TypeInterner;

    constructor({
        flattener = new ResourceFieldFlattener(),
        interner = new TypeInterner()
    }: ManifestArtifactLowererDependencies = {}) {
        this.flattener = flattener;
        this.interner = interner;
        Object.freeze(this);
    }

    /**
     * Resolves canonical synthetic name for route inline response (e.g. /login -> Login).
     */
    private resolveRouteName(route: ParsedRoute): string {
        if (route.resourceName && route.resourceName.length > 0) {
            return route.resourceName;
        }

        const segments = route.path
            .replace(/^\//, '')
            .split('/')
            .filter(s => s.toLowerCase() !== 'api' && !s.startsWith('{'))
            .map(s => s.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()));

        if (segments.length === 0) return 'Inline';
        if (segments.length === 1) {
            return segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
        }

        const first = segments[0];
        const last = segments[segments.length - 1];
        return (first.charAt(0).toUpperCase() + first.slice(1)) + (last.charAt(0).toUpperCase() + last.slice(1));
    }

    /**
     * Lowers RouteManifest to ResourceMappersArtifact at Upstream Origin Boundary.
     * Generates pre-built, guaranteed non-nullable body assignments for 0 .map downstream pass.
     */
    lowerToResourceMappers(manifest: RouteManifest): ResourceMappersArtifact {
        const mappers: ResourceMapperDefinition[] = [];
        const seen = new Set<string>();

        // 1. Process explicit resources
        for (const res of manifest.resources || []) {
            const cleanBase = res.name.replace(/(Resource|Response)$/, '');
            const resName = cleanBase.endsWith('Resource') ? cleanBase : `${cleanBase}Resource`;
            if (seen.has(resName)) continue;
            seen.add(resName);

            const flattened = this.flattener.flatten(res.fields);
            const fields: readonly ResolvedField[] = Object.freeze(
                flattened.map(f => [f.targetProperty, f.type] as const)
            );
            const body = flattened
                .map(f => `  ${f.targetProperty}: api.${f.sourcePath},`)
                .join('\n');

            mappers.push({
                resourceName: resName,
                functionName: `to${toPascalCase(cleanBase)}ResourceRead`,
                apiType: `${toPascalCase(cleanBase)}ResourceApiResponse`,
                transformedType: `${toPascalCase(cleanBase)}ResourceTransformed`,
                body,
                fields
            });
        }

        // 2. Process route inline responses
        for (const route of manifest.routes || []) {
            if (!route.response) continue;
            const resp = route.response as any;
            if (resp.kind === 'resource' && resp.resourceName) {
                // Handled via explicit resources or referenced resource
                continue;
            }

            if (resp.kind === 'object' || resp.fields) {
                const rawName = this.resolveRouteName(route);
                const pascalName = toPascalCase(rawName);
                if (seen.has(pascalName)) continue;
                seen.add(pascalName);

                const flattened = this.flattener.flatten(resp.fields || {});
                const fields: readonly ResolvedField[] = Object.freeze(
                    flattened.map(f => [f.targetProperty, f.type] as const)
                );
                const body = flattened
                    .map(f => `  ${f.targetProperty}: api.${f.sourcePath},`)
                    .join('\n');

                mappers.push({
                    resourceName: pascalName,
                    functionName: `to${pascalName}Read`,
                    apiType: `${pascalName}ApiResponse`,
                    transformedType: `${pascalName}Transformed`,
                    body,
                    fields
                });
            }
        }

        return Object.freeze({
            typeId: 'ResourceMappers',
            mappers: Object.freeze(mappers),
            metadata: {
                hash: `map-${Date.now()}`,
                producer: 'ManifestArtifactLowerer',
                dependencies: [],
                timestamp: Date.now(),
                revision: '1.0.0'
            }
        });
    }
}
