/**
 * wrapperResolver.ts
 *
 * Resolves nullable wrappers and converts ObjectType shapes.
 *
 * @module compiler/domain/common/response-lowering/mapper
 */

import type { ObjectType } from '../../../../types/SemanticType';
import type { ParsedResponseField } from '../../../../generators/contract-generation/ResponseFieldParser';
import type { SemanticTypeResolver } from '../../SemanticTypeResolver';
import type {
    NullableWrapperResult,
    StageResult
} from '../loweringContracts';
import { convertResolvedTypeToResponseField } from './fieldConverter';

/**
 * Helper to resolve nullable wrapper object annotation via pure switch
 */
export function resolveNullableWrapper(
    fieldName: string,
    objectType: ObjectType,
    resolver: SemanticTypeResolver
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
    resolver: SemanticTypeResolver
): StageResult<ParsedResponseField> {
    const resolved = resolver.resolve(objectType);
    return convertResolvedTypeToResponseField(fieldName, resolved, resolver);
}
