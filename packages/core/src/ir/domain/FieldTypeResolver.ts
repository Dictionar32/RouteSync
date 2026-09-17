/**
 * @file FieldTypeResolver.ts
 * @description Active Consumer: Sub-domain resolver for field types, semantic transformations, and projection shapes
 *
 * @module core/ir/domain/FieldTypeResolver
 */

import type {
    TypeIR,
    ManifestField,
    ResourceFieldIR,
    ResolvedSemanticType
} from '../../types/ir';

import {
    TypeIRUtils
} from '../../types/ir';

import {
    PRIMITIVE_RESOLVED_TYPES,
    type ProjectionHints,
    type OptimizedResourceFieldIR,
    type DiagnosticCollector
} from './irTypes';
import {
    transformFieldName,
    projectForForm,
    convertToLegacyFieldIR,
    convertSemanticToTypeIR
} from './field-type';

export class FieldTypeResolver {
    constructor(
        private readonly diagnostics: DiagnosticCollector,
        private readonly caseTransform: string = 'camel'
    ) {}

    public buildOptimizedResourceField(field: ManifestField): OptimizedResourceFieldIR {
        const semanticType = this.resolveSemanticType(field);
        const baseType = this.semanticToTypeIR(semanticType);

        let projectedType = baseType;

        if (field.nullable) {
            projectedType = TypeIRUtils.makeNullable(projectedType);
        }
        if (field.optional) {
            projectedType = TypeIRUtils.makeOptional(projectedType);
        }

        const hints: ProjectionHints = {
            formNullableAsOptional: field.nullable === true,
            stripModifiers: false,
            includeRuntimeChecks: field.nullable || field.optional
        };

        return {
            name: field.name,
            transformedName: this.transformFieldName(field.name, this.caseTransform),
            type: projectedType,
            semanticType,
            hints,
            description: field.description,
            validation: field.validation ? { type: 'required' } : undefined,
            source: field.resolved?.model ? {
                type: 'model_column' as const,
                path: field.name,
                model: field.resolved.model
            } : {
                type: 'computed' as const,
                path: field.name
            }
        };
    }

    public convertToLegacyFieldIR(field: OptimizedResourceFieldIR): ResourceFieldIR {
        return convertToLegacyFieldIR(field);
    }

    public projectForForm(type: TypeIR): TypeIR {
        return projectForForm(type);
    }

    public semanticToTypeIR(semanticType: ResolvedSemanticType): TypeIR {
        return convertSemanticToTypeIR(semanticType, this.diagnostics);
    }

    private resolveSemanticType(field: ManifestField): ResolvedSemanticType {
        this.diagnostics.info(`Using origin semantic type for ${field.name}`);
        return field.semanticType;
    }

    public transformFieldName(phpName: string, caseTransform: string = 'camel'): string {
        return transformFieldName(phpName, caseTransform);
    }
}
