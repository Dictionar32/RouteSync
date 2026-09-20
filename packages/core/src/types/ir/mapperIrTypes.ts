/**
 * Mapper domain IR: mapping is already resolved at the origin boundary.
 */

export type TransformFunction =
    | 'identity'
    | 'date_iso'
    | 'date_human'
    | 'currency_minor'
    | 'currency_major'
    | 'enum_value'
    | 'custom';

import type { ModelName, PropertyName, ResponseTypeName } from './nominalVocabulary';

export interface MapperFieldIR {
    readonly source: PropertyName;
    readonly target: PropertyName;
    readonly transform: TransformFunction;
}

export interface MapperIR {
    readonly source: ModelName;
    readonly target: ResponseTypeName;
    readonly mappings: readonly MapperFieldIR[];
}
