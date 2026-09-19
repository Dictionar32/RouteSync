/**
 * Model semantic extractors.
 *
 * Input is already a verified model ADT. No unknown values, shape probing,
 * string fallback, or synthetic semantic types are allowed downstream.
 */

import type { ParsedColumn } from '../../../../types/domain/databaseColumns';
import type { ParsedAccessor, ParsedCast } from '../../../../types/domain/eloquentTypes';
import type { PropertyName } from '../../../../types/domain/semanticValues';

export interface ExtractedAccessorInfo {
    readonly propertyName: PropertyName;
    readonly computation: ParsedAccessor['computation'];
}

export function extractModelAccessors(
    accessors: readonly ParsedAccessor[]
): readonly ExtractedAccessorInfo[] {
    return accessors.map(accessor => ({
        propertyName: accessor.propertyName,
        computation: accessor.computation
    }));
}

