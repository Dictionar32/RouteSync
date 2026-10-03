/**
 * ResponseFieldLowering.ts
 *
 * Dedicated Domain Lowering Module for Transforming SemanticType ASTs into ParsedResponseFields.
 * Conforms to Rule 14: Active Consumer Orchestrator, 0 wildcard re-exports.
 *
 * @module compiler/domain/common
 */

import type { ObjectType, SemanticType, ObjectProperty } from '../../types/SemanticType';
import type { ParsedResponseField } from '../../generators/contract-generation/ResponseFieldParser';
import { SemanticTypeResolver } from './SemanticTypeResolver';
import { relationProject } from '../../../semantic/kernel/relationalSequence';
import {
    type NullableWrapperResult,
    type StageResult,
    type ResponseFieldConversionResult,
    partitionResults,
    convertResolvedTypeToResponseField,
    resolveNullableWrapper,
    convertObjectType
} from './response-lowering';

export {
    type NullableWrapperResult,
    type StageResult,
    type ResponseFieldConversionResult,
    partitionResults,
    convertResolvedTypeToResponseField,
    resolveNullableWrapper,
    convertObjectType
};

export const defaultTypeResolver = SemanticTypeResolver.default();

/**
 * Observable convertResponseFields via Pure Map + flatMap Partition Pipeline
 */
export function convertResponseFields(
    fields: readonly ObjectProperty[],
    resolver: SemanticTypeResolver = defaultTypeResolver
): ResponseFieldConversionResult {
    const results = relationProject(fields, field =>
        convertSingleResponseField(field.name.value.value, field.type, resolver)
    );

    return partitionResults(results);
}

/**
 * Pure Pattern Matching Stage-2 Converter for individual SemanticType -> ConversionResult<ParsedResponseField>
 */
export function convertSingleResponseField(
    fieldName: string,
    semanticType: SemanticType,
    resolver: SemanticTypeResolver = defaultTypeResolver
): StageResult<ParsedResponseField> {
    const resolved = resolver.resolve(semanticType);
    return convertResolvedTypeToResponseField(fieldName, resolved, resolver);
}
