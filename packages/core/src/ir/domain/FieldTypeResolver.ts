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
import { createPropertyName } from '../../types/ir/nominalVocabulary';

export class FieldTypeResolver {
    constructor(
        private readonly diagnostics: DiagnosticCollector,
        private readonly caseTransform: string = 'camel'
    ) {}

    public buildOptimizedResourceField(field: ManifestField): OptimizedResourceFieldIR {
        const semanticType = this.resolveSemanticType(field);
        const baseType = this.semanticToTypeIR(semanticType);
        const hints: ProjectionHints = {
            formNullableAsOptional: semanticType.kind === 'nullable',
            stripModifiers: false,
            includeRuntimeChecks: semanticType.kind === 'nullable'
        };

        return {
            name: field.name,
            transformedName: createPropertyName(this.transformFieldName(field.name, this.caseTransform)),
            type: baseType,
            semanticType,
            hints,
            description: field.description,
            validation: field.validationRules,
            source: {
                type: 'computed',
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
