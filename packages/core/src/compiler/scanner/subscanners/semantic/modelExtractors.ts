/**
 * Model semantic extractors.
 *
 * Input is already a verified model ADT. No unknown values, shape probing,
 * string fallback, or synthetic semantic types are allowed downstream.
 */

import type { ParsedColumn } from '../../../../types/domain/databaseColumns';
import type { ParsedAccessor, ParsedCast } from '../../../../types/domain/eloquentTypes';
import type { PropertyName } from '../../../../types/domain/semanticValues';

export function findCastForColumn(
    casts: readonly ParsedCast[],
    columnName: string
): ParsedCast | undefined {
    return casts.find(cast => cast.column.value === columnName);
}

export interface ExtractedAccessorInfo {
    readonly propertyName: PropertyName;
    readonly semanticType: ParsedAccessor['semanticType'];
}

export function extractModelAccessors(
    accessors: readonly ParsedAccessor[]
): readonly ExtractedAccessorInfo[] {
    return accessors.map(accessor => ({
        propertyName: accessor.propertyName,
        semanticType: accessor.semanticType
    }));
}

export function resolveColumnSemanticType(
    column: ParsedColumn,
    cast: ParsedCast | undefined
): ParsedColumn['semanticType'] {
    return cast === undefined ? column.semanticType : cast.semanticType;
}
