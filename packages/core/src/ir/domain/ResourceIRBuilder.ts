/**
 * @file ResourceIRBuilder.ts
 * @description Sub-domain builder for ResourceIR, nested object resource extraction, and resource aliases
 *
 * @module core/ir/domain/ResourceIRBuilder
 */

import { createHash } from 'crypto';
import type {
    ResourceIR,
    ResourceVariantIR,
    ParsedResource,
    ManifestField,
    ResourceAliasIR,
    ResolvedSemanticType
} from '../../types/ir';

import { ReferenceType } from '../../compiler/types/SemanticType';
import { resourceBaseName } from '../../utils/resource-naming';
import type { FieldTypeResolver } from './FieldTypeResolver';
import type { ResourceMapperBuilder } from './ResourceMapperBuilder';

export class ResourceIRBuilder {
    constructor(
        private readonly fieldTypeResolver: FieldTypeResolver,
        private readonly mapperBuilder: ResourceMapperBuilder
    ) {}

    public extractNestedObjectResource(
        parentResourceName: string,
        field: ManifestField,
        resources: Map<string, ResourceIR>
    ): ManifestField {
        const semanticType = field.semanticType;
        if (typeof semanticType !== 'object' || semanticType.kind !== 'object') {
            return field;
        }
        if (semanticType.properties.length === 0) {
            return field;
        }

        const parentBase = parentResourceName.replace(/(Resource|Response)$/, '');
        const pascalFieldName = field.name.charAt(0).toUpperCase() + field.name.slice(1);
        const syntheticName = parentBase + pascalFieldName;

        if (!resources.has(syntheticName)) {
            const subFields: Array<{
                name: string;
                type: string;
                semanticType: ResolvedSemanticType;
                presence: { readonly kind: 'required' | 'optional' };
                validation: import('../../types/upstream/collections').ValidationRules;
            }> = semanticType.properties.map(property => ({
                name: property.name,
                type: property.type.kind,
                semanticType: property.type,
                presence: { kind: property.presence === 'optional' ? 'optional' : 'required' },
                validation: { kind: 'validation_rules', items: { kind: 'empty' } },
                description: property.description
            }));

            const subResource: ParsedResource = {
                name: syntheticName,
                sourceModel: undefined,
                fields: subFields,
                controller: undefined,
                routes: [],
                isSynthetic: true
            };

            resources.set(syntheticName, this.buildResourceIR(subResource, resources));
        }

        return {
            ...field,
            semanticType: ReferenceType.resource('', syntheticName)
        };
    }

    public buildResourceIR(resource: ParsedResource, resources: Map<string, ResourceIR>): ResourceIR {
        const processedFields = resource.fields.map(field =>
            this.extractNestedObjectResource(resource.name, field, resources)
        );
        const fields = processedFields.map(field =>
            this.fieldTypeResolver.buildOptimizedResourceField(field)
        );
        const legacyFields = fields.map(f =>
            this.fieldTypeResolver.convertToLegacyFieldIR(f)
        );

        const readVariant: ResourceVariantIR = {
            kind: 'read',
            fields: legacyFields,
            metadata: {
                purpose: 'TypeScript interfaces for read operations',
                generator: 'ReadEmitter'
            }
        };

        const aliases = resource.isSynthetic === true ? [] : this.buildResourceAliases(resource);

        return {
            id: this.generateResourceId(resource),
            name: resource.name,
            sourceModel: resource.sourceModel,
            fields: legacyFields,
            aliases,
            variants: [readVariant],
            mapper: this.mapperBuilder.buildResourceMapper(resource, fields),
            metadata: {
                sourceFile: resource.name,
                controller: resource.controller,
                routes: resource.routes,
                dependencies: this.mapperBuilder.extractDependencies(fields)
            }
        };
    }

    public buildResourceAliases(resource: ParsedResource): ResourceAliasIR[] {
        const baseName = resourceBaseName(resource.name);

        if (resource.isSynthetic === true) {
            return [];
        }

        return [
            {
                name: `${baseName}Show`,
                kind: 'show',
                target: `${baseName}Transformed`
            },
            {
                name: `${baseName}Index`,
                kind: 'index',
                target: `${baseName}Transformed`,
                isArray: true
            }
        ];
    }

    public generateResourceId(resource: ParsedResource): string {
        return createHash('md5')
            .update(`resource:${resource.name}:${resource.sourceModel || 'unknown'}`)
            .digest('hex')
            .substring(0, 8);
    }
}
