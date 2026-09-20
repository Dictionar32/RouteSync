/**
 * @file FieldTypeResolver.ts
 * @description Active Consumer: Sub-domain resolver for field types, semantic transformations, and projection shapes
 *
 * @module core/ir/domain/FieldTypeResolver
 */

import type { TypeIR, ManifestField, ResourceFieldIR } from '../../types/ir';
import type { SemanticType } from '../../compiler/types/SemanticType';


import {
    type OptimizedResourceFieldIR,
    type DiagnosticCollector
} from './irTypes';
import {
    transformFieldName,
    projectForForm,
    convertToLegacyFieldIR,
    convertSemanticToTypeIR
} from './field-type';
import { createPropertyName } from '../../types/ir/nominalVocabulary';
import type { TransformFunction } from '../../types/ir';

export class FieldTypeResolver {
    constructor(
        private readonly diagnostics: DiagnosticCollector,
        private readonly caseTransform: string = 'camel'
    ) {}

    public buildOptimizedResourceField(field: ManifestField): OptimizedResourceFieldIR {
        const semanticType = this.resolveSemanticType(field);
        const baseType = this.semanticToTypeIR(semanticType);
        const projections = {
            contract: baseType,
            read: baseType,
            form: projectForForm(baseType),
            field: baseType,
            mapper: baseType,
            schema: baseType
        } as const;

        return {
            name: field.name,
            transformedName: createPropertyName(this.transformFieldName(field.name.value.value, this.caseTransform)),
            type: baseType,
            semanticType,
            projections,
            transform: this.resolveTransform(semanticType),
            description: field.description,
            validation: field.validation,
            source: {
                type: 'computed',
                path: field.name
            }
        };
    }

    private resolveTransform(semanticType: SemanticType): TransformFunction {
        if (semanticType.kind !== 'primitive') {
            return 'identity';
        }
        if (semanticType.type === 'datetime') {
            return 'date_iso';
        }
        return 'identity';
    }

    public convertToLegacyFieldIR(field: OptimizedResourceFieldIR): ResourceFieldIR {
        return convertToLegacyFieldIR(field);
    }

    public projectForForm(type: TypeIR): TypeIR {
        return projectForForm(type);
    }

    public semanticToTypeIR(semanticType: SemanticType): TypeIR {
        return convertSemanticToTypeIR(semanticType);
    }

    private resolveSemanticType(field: ManifestField): SemanticType {
        this.diagnostics.info(`Using origin semantic type for ${field.name.value.value}`);
        return field.semanticType;
    }

    public transformFieldName(phpName: string, caseTransform: string = 'camel'): string {
        return transformFieldName(phpName, caseTransform);
    }
}
