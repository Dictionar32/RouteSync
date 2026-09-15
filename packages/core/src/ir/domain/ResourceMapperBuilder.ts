/**
 * @file ResourceMapperBuilder.ts
 * @description Sub-domain builder for Resource mappers, transformation rules, and dependencies
 *
 * @module core/ir/domain/ResourceMapperBuilder
 */

import type {
    TypeIR,
    ParsedResource,
    MapperIR,
    MapperFieldIR,
    TransformationRules,
    TransformFunction,
    ValidationRules
} from '../../types/ir';

import { TypeIRUtils } from '../../types/ir';
import { resourceBaseName } from '../../utils/resource-naming';
import type { OptimizedResourceFieldIR } from './irTypes';

export class ResourceMapperBuilder {
    public buildResourceMapper(resource: ParsedResource, fields: OptimizedResourceFieldIR[]): MapperIR {
        const mappings: MapperFieldIR[] = fields.map(field => ({
            source: field.name,
            target: field.transformedName,
            transform: this.detectTransformFunction(field)
        }));

        return {
            source: resource.sourceModel || resource.name,
            target: `${resourceBaseName(resource.name)}Transformed`,
            mappings,
            transformations: this.buildTransformationRules(fields)
        };
    }

    public detectTransformFunction(field: OptimizedResourceFieldIR): TransformFunction | undefined {
        const baseType = TypeIRUtils.unwrapType(field.type);

        if (baseType.kind === 'primitive' && baseType.type === 'date') return 'date_iso';
        if (field.name.includes('amount') || field.name.includes('price')) return 'currency_minor';

        return undefined;
    }

    public buildTransformationRules(fields: OptimizedResourceFieldIR[]): TransformationRules {
        return {
            dateFields: fields.filter(f => {
                const baseType = TypeIRUtils.unwrapType(f.type);
                return baseType.kind === 'primitive' && baseType.type === 'date';
            }).map(f => f.transformedName),

            currencyFields: fields.filter(f =>
                f.name.includes('amount') || f.name.includes('price') || f.name.includes('cost')
            ).map(f => f.transformedName),

            enumFields: [],
            customTransforms: []
        };
    }

    public buildValidationRules(validation: Record<string, unknown>): ValidationRules {
        return {
            type: 'required'
        };
    }

    public extractDependencies(fields: OptimizedResourceFieldIR[]): string[] {
        const dependencies = new Set<string>();
        for (const field of fields) {
            this.collectTypeReferences(field.type, dependencies);
        }
        return Array.from(dependencies);
    }

    private collectTypeReferences(type: TypeIR, dependencies: Set<string>): void {
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
                for (const propType of Object.values(type.properties)) {
                    this.collectTypeReferences(propType, dependencies);
                }
                break;
        }
    }
}
