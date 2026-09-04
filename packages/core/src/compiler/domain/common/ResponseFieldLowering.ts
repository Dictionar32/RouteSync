/**
 * ResponseFieldLowering.ts
 *
 * Dedicated Domain Lowering Module for Transforming SemanticType ASTs into ParsedResponseFields.
 * Consumes SemanticTypeResolver to operate strictly on Target-Agnostic ResolvedSemanticType domain value objects.
 *
 * @module compiler/domain/common
 */

import {
    ObjectType,
    type SemanticType
} from '../../types/SemanticType';
import type { ParsedResponseField } from '../../generators/contract-generation/ResponseFieldParser';
import { ConversionResult } from './ConversionResult';
import { SemanticTypeResolver } from './SemanticTypeResolver';
import {
    ResolvedPrimitiveType,
    ResolvedReferenceType,
    ResolvedNullableType,
    ResolvedCollectionType,
    ResolvedObjectType,
    ResolvedUnknownType,
    type ResolvedSemanticType
} from './ResolvedSemanticType';

export const defaultTypeResolver = new SemanticTypeResolver();

/**
 * Result contract for Nullable Wrapper resolution
 */
export type NullableWrapperResult =
    | {
          readonly isNullableWrapper: true;
          readonly field: ParsedResponseField;
          readonly warnings: readonly string[];
      }
    | {
          readonly isNullableWrapper: false;
      };

/**
 * Stage Result contract for ParsedResponseField collections
 */
export type StageResult<T> = ConversionResult<T>;

/**
 * Observable ResponseFieldConversionResult alias
 */
export type ResponseFieldConversionResult = ConversionResult<ParsedResponseField>;

/**
 * Pure helper to partition a collection of ConversionResults into fields and warnings
 */
export function partitionResults<T>(
    results: readonly ConversionResult<T>[]
): ConversionResult<T> {
    const fields = results.flatMap(r => r.fields);
    const warnings = results.flatMap(r => r.warnings);

    return new ConversionResult({ fields, warnings });
}

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
 * Helper to resolve nullable wrapper object annotation via pure switch
 */
export function resolveNullableWrapper(
    fieldName: string,
    objectType: ObjectType,
    resolver: SemanticTypeResolver = defaultTypeResolver
): NullableWrapperResult {
    const resolved = resolver.resolve(objectType);

    switch (resolved.kind) {
        case 'nullable': {
            const innerResult = convertResolvedTypeToResponseField(fieldName, resolved.innerType, resolver);
            const itemType = innerResult.fields[0];
            switch (itemType) {
                case undefined:
                    return { isNullableWrapper: false };
                default:
                    return {
                        isNullableWrapper: true,
                        field: {
                            name: itemType.name,
                            kind: itemType.kind,
                            type: itemType.type,
                            nullable: true,
                            optional: itemType.optional,
                            fields: itemType.fields,
                            itemType: itemType.itemType
                        },
                        warnings: innerResult.warnings
                    };
            }
        }
        default:
            return { isNullableWrapper: false };
    }
}

/**
 * Pure helper to convert ObjectType without redundant re-resolutions
 */
export function convertObjectType(
    fieldName: string,
    objectType: ObjectType,
    resolver: SemanticTypeResolver = defaultTypeResolver
): StageResult<ParsedResponseField> {
    const resolved = resolver.resolve(objectType);
    return convertResolvedTypeToResponseField(fieldName, resolved, resolver);
}

/**
 * Convert Target-Agnostic ResolvedSemanticType to ParsedResponseField ConversionResult
 */
export function convertResolvedTypeToResponseField(
    fieldName: string,
    resolved: ResolvedSemanticType,
    resolver: SemanticTypeResolver = defaultTypeResolver
): StageResult<ParsedResponseField> {
    switch (resolved.kind) {
        case 'primitive':
            return new ConversionResult({
                fields: [{
                    name: fieldName,
                    kind: 'primitive',
                    type: resolved.primitiveKind,
                    nullable: false,
                    optional: false
                }]
            });

        case 'reference':
            return new ConversionResult({
                fields: [{
                    name: fieldName,
                    kind: 'primitive',
                    type: resolved.name,
                    nullable: false,
                    optional: false
                }]
            });

        case 'nullable': {
            const innerResult = convertResolvedTypeToResponseField(fieldName, resolved.innerType, resolver);
            const itemType = innerResult.fields[0];
            switch (itemType) {
                case undefined:
                    return new ConversionResult();
                default:
                    return new ConversionResult({
                        fields: [{
                            ...itemType,
                            nullable: true
                        }],
                        warnings: innerResult.warnings
                    });
            }
        }

        case 'optional': {
            const innerResult = convertResolvedTypeToResponseField(fieldName, (resolved as any).innerType, resolver);
            const itemType = innerResult.fields[0];
            switch (itemType) {
                case undefined:
                    return new ConversionResult();
                default:
                    return new ConversionResult({
                        fields: [{
                            ...itemType,
                            optional: true
                        }],
                        warnings: innerResult.warnings
                    });
            }
        }

        case 'collection': {
            const innerResult = convertResolvedTypeToResponseField('item', resolved.elementType, resolver);
            return new ConversionResult({
                fields: [{
                    name: fieldName,
                    kind: 'array',
                    type: 'array',
                    nullable: false,
                    optional: false,
                    itemType: innerResult.fields[0]
                }],
                warnings: innerResult.warnings
            });
        }

        case 'object': {
            const conversionResults = resolved.fields.map(
                ([propName, propType]) => convertResolvedTypeToResponseField(propName, propType, resolver)
            );
            const { fields: nestedFields, warnings: nestedWarnings } = partitionResults(conversionResults);

            return new ConversionResult({
                fields: [{
                    name: fieldName,
                    kind: 'object',
                    type: 'object',
                    nullable: false,
                    optional: false,
                    fields: nestedFields
                }],
                warnings: nestedWarnings
            });
        }

        case 'unknown':
        default:
            return new ConversionResult({
                warnings: [`Skipped field '${fieldName}': ${(resolved as ResolvedUnknownType).diagnosticMessage ?? 'unsupported SemanticType'}`]
            });
    }
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
