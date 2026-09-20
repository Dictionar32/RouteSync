/**
 * @file ResourceMapperBuilder.ts
 * @description Builds a mapper from already-resolved field intents.
 */

import type {
    MapperIR,
    MapperFieldIR,
    ParsedResource
} from '../../types/ir';

import { resourceBaseName } from '../../utils/resource-naming';
import { createResponseTypeName } from '../../types/ir/nominalVocabulary';
import type { OptimizedResourceFieldIR } from './irTypes';

export class ResourceMapperBuilder {
    public buildResourceMapper(resource: ParsedResource, fields: OptimizedResourceFieldIR[]): MapperIR {
        const mappings: MapperFieldIR[] = fields.map(field => ({
            source: field.name,
            target: field.transformedName,
            transform: field.transform
        }));

        return {
            source: resource.sourceModel,
            target: createResponseTypeName(`${resourceBaseName(resource.name.value.value)}Transformed`),
            mappings
        };
    }

    public extractDependencies(fields: OptimizedResourceFieldIR[]): string[] {
        const dependencies = new Set<string>();
        for (const field of fields) {
            this.collectTypeReferences(field.type, dependencies);
        }
        return Array.from(dependencies);
    }

    private collectTypeReferences(type: import('../../types/ir').TypeIR, dependencies: Set<string>): void {
        switch (type.kind) {
            case 'reference':
                dependencies.add(type.target);
                break;
            case 'array':
                this.collectTypeReferences(type.items, dependencies);
                break;
            case 'nullable':
            case 'optional':
                this.collectTypeReferences(type.inner, dependencies);
                break;
            case 'union':
                for (const unionType of type.types) {
                    this.collectTypeReferences(unionType, dependencies);
                }
                break;
            case 'inline_object':
                for (const property of type.properties) {
                    this.collectTypeReferences(property.type, dependencies);
                }
                break;
        }
    }
}
