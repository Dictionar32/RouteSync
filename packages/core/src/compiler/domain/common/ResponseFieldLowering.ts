/**
 * ResponseFieldLowering.ts
 *
 * Dedicated Domain Lowering Module for Transforming SemanticType ASTs into ParsedResponseFields.
 * Conforms to Rule 14: Active Consumer Orchestrator, 0 wildcard re-exports.
 *
 * @module compiler/domain/common
 */

import type { ObjectType, SemanticType } from '../../types/SemanticType';
import type { ParsedResponseField } from '../../generators/contract-generation/ResponseFieldParser';
import { SemanticTypeResolver } from './SemanticTypeResolver';
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

export const defaultTypeResolver = new SemanticTypeResolver();

/**
 * Observable convertResponseFields via Pure Map + flatMap Partition Pipeline
 */
export function convertResponseFields(
    fields: Record<string, SemanticType>,
    resolver: SemanticTypeResolver = defaultTypeResolver
): ResponseFieldConversionResult {
    const results = Object.entries(fields).map(([name, type]) =>
        convertSingleResponseField(name, type, resolver)
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
