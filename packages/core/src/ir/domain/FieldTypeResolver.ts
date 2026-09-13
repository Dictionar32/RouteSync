/**
 * @file FieldTypeResolver.ts
 * @description Active Consumer: Sub-domain resolver for field types, semantic transformations, and projection shapes
 *
 * @module core/ir/domain/FieldTypeResolver
 */

import type {
    TypeIR,
    ParsedField,
    ResourceFieldIR,
    ResolvedSemanticType
} from '../../types/ir';

import {
    ResolvedSemanticTypeFactory,
    TypeIRUtils
} from '../../types/ir';

import type { SemanticType } from '../../types/semantic';
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

    public buildOptimizedResourceField(field: ParsedField): OptimizedResourceFieldIR {
        let semanticType: SemanticType | ResolvedSemanticType | undefined = field.semanticType;

        if (field.resolved?.type && PRIMITIVE_RESOLVED_TYPES.has(field.resolved.type)) {
            semanticType = ResolvedSemanticTypeFactory.primitive(
                field.resolved.type,
                null,
                field.resolved
            );
            this.diagnostics.info(`Using resolved type for ${field.name}: ${field.resolved.type}`);
        } else if (!field.resolved?.type) {
            this.diagnostics.warn(`No resolved type for field: ${field.name}`);
        }

        let baseType = this.semanticToTypeIR(semanticType);

        if (field.nullable) {
            baseType = TypeIRUtils.makeNullable(baseType);
        }
        if (field.optional) {
            baseType = TypeIRUtils.makeOptional(baseType);
        }

        const hints: ProjectionHints = {
            formNullableAsOptional: field.nullable === true,
            stripModifiers: false,
            includeRuntimeChecks: field.nullable || field.optional
        };

        return {
            name: field.name,
            transformedName: this.transformFieldName(field.name, this.caseTransform),
            type: baseType,
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

    public semanticToTypeIR(semanticType: SemanticType | ResolvedSemanticType | undefined): TypeIR {
        return convertSemanticToTypeIR(semanticType, this.diagnostics);
    }

    public transformFieldName(phpName: string, caseTransform: string = 'camel'): string {
        return transformFieldName(phpName, caseTransform);
    }
}
