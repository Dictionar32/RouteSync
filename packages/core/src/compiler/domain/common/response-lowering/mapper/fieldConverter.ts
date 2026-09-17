/**
 * fieldConverter.ts
 *
 * Convert Target-Agnostic ResolvedSemanticType to ParsedResponseField ConversionResult.
 *
 * @module compiler/domain/common/response-lowering/mapper
 */

import type { ParsedResponseField } from '../../../../generators/contract-generation/ResponseFieldParser';
import { ConversionResult } from '../../ConversionResult';
import type { SemanticTypeResolver } from '../../SemanticTypeResolver';
import type {
    ResolvedSemanticType,
    ResolvedUnknownType
} from '../../ResolvedSemanticType';
import {
    type StageResult,
    partitionResults
} from '../loweringContracts';

export function convertResolvedTypeToResponseField(
    fieldName: string,
    resolved: ResolvedSemanticType,
    resolver: SemanticTypeResolver
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
            const innerResult = convertResolvedTypeToResponseField(fieldName, resolved.innerType, resolver);
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
            const conversionResults = resolved.fields.map(({ name: propName, type: propType, presence }) => {
                const fieldResult = convertResolvedTypeToResponseField(propName, propType, resolver);
                if (presence === 'required') {
                    return fieldResult;
                }
                const item = fieldResult.fields[0];
                if (!item) {
                    return fieldResult;
                }
                return new ConversionResult({
                    fields: [{ ...item, optional: true }],
                    warnings: fieldResult.warnings
                });
            });
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
