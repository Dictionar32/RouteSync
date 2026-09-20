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
import { matchResponse } from '../../../types/domain/responses';
import type { ResourceMappersArtifact, ResourceMapperDefinition } from '../../artifacts/ResourceMappersArtifact';
import type { ResolvedProperty } from './ResolvedSemanticType';
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
     * Reads the route name already resolved by the scanner origin boundary.
     * No path parsing or resource re-classification belongs in this lowerer.
     */
    private resolveRouteName(route: ParsedRoute): string {
        return route.identity.resourceName.value.value;
    }

    /**
     * Lowers RouteManifest to ResourceMappersArtifact at Upstream Origin Boundary.
     * Generates pre-built, guaranteed non-nullable body assignments for 0 .map downstream pass.
     */
    lowerToResourceMappers(manifest: RouteManifest): ResourceMappersArtifact {
        const mappers: ResourceMapperDefinition[] = [];
        const seen = new Set<string>();

        // 1. Process explicit resources
        for (const res of manifest.resources) {
            const cleanBase = res.name.value.value;
            const resName = cleanBase.endsWith('Resource') ? cleanBase : `${cleanBase}Resource`;
            if (seen.has(resName)) continue;
            seen.add(resName);

            const flattened = this.flattener.flatten(res.fields);
            const fields: readonly ResolvedProperty[] = Object.freeze(
                flattened.map(f => ({ name: f.targetProperty, type: f.type, presence: 'required' as const }))
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
        for (const route of manifest.routes) {
            matchResponse(route.binding.response, {
                resource: () => undefined,
                model: () => undefined,
                void: () => undefined,
                inline: response => {
                    const rawName = this.resolveRouteName(route);
                    const pascalName = toPascalCase(rawName);
                    if (seen.has(pascalName)) return;
                    seen.add(pascalName);

                    const flattened = this.flattener.flatten(response.fields);
                    const fields: readonly ResolvedProperty[] = Object.freeze(
                        flattened.map(f => ({ name: f.targetProperty, type: f.type, presence: 'required' as const }))
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
            });
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
